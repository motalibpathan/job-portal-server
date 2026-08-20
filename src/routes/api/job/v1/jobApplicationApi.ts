import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import Company, {
  ICompanyDocument,
} from "../../../../database/models/company/company";
import Job from "../../../../database/models/job/job";
import JobApplication from "../../../../database/models/jobApplication/jobApplication";
import { authenticator } from "../../../../middlewares/authenticator";
import { flatZodInputValidator } from "../../../../middlewares/inputValidator";
import { uploadDocumentToStorage } from "../../../../util/mediaLibraryUtils/documentUtils";
import {
  applicationIdParamSchema,
  myApplicationIdParamSchema,
  submitApplicationBodySchema,
  updateApplicationStatusBodySchema,
} from "../../../../validators/job/jobApplicationValidator";
import { jobIdParamSchema } from "../../../../validators/job/jobValidator";

const router = express.Router();
const upload = multer(); // in-memory storage — buffer available on req.file

// Allowed mime types for resume / portfolio documents
const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/msword", // doc
];

// Helper: resolve company from params
async function resolveCompany(
  companyIdOrUsername: string,
): Promise<ICompanyDocument | null> {
  const isObjectId = mongoose.isObjectIdOrHexString(companyIdOrUsername);
  return Company.findOne(
    isObjectId ? { _id: companyIdOrUsername } : { userName: companyIdOrUsername },
  );
}

// ─────────────────────────────────────────────
// 0. Upload a Document (resume, portfolio, etc.)
// POST /:companyIdOrUsername/jobs/:jobId/applications/upload-document
// Access: public — call this before submitting the application
// Returns: { url } — pass this URL as the answer value for document fields
// ─────────────────────────────────────────────
router.post(
  "/:companyIdOrUsername/jobs/:jobId/applications/upload-document",
  flatZodInputValidator(null, jobIdParamSchema),
  upload.any(), // accepts multiple named fields: resume, coverLetter, portfolio, etc.
  async (req, res) => {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        message: "No files provided. Send files using their fieldId as the field name.",
      });
    }

    // Validate every uploaded file before uploading any
    for (const file of files) {
      if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(file.mimetype)) {
        return res.status(400).json({
          message: `Unsupported file type for field '${file.fieldname}'. Allowed: PDF, DOC, DOCX`,
        });
      }
      if (file.buffer.byteLength > 10 * 1024 * 1024) {
        return res.status(400).json({
          message: `File too large for field '${file.fieldname}'. Maximum size is 10 MB`,
        });
      }
    }

    const { jobId } = req.params;

    // Upload all files in parallel and build { [fieldId]: url } map
    const uploadResults = await Promise.all(
      files.map(async (file) => {
        const url = await uploadDocumentToStorage(
          file.originalname,
          file.buffer,
          jobId,
          "job-applications",
          file.originalname,
        );
        return { fieldId: file.fieldname, url };
      }),
    );

    // Return as a plain object: { resume: "...", coverLetter: "..." }
    const urlMap = uploadResults.reduce<Record<string, string>>(
      (acc, { fieldId, url }) => {
        acc[fieldId] = url;
        return acc;
      },
      {},
    );

    return res.json(urlMap);
  },
);

// ─────────────────────────────────────────────
// 1. Submit Application
// POST /:companyIdOrUsername/jobs/:jobId/applications
// Access: public (guest or logged-in user)
// ─────────────────────────────────────────────
router.post(
  "/:companyIdOrUsername/jobs/:jobId/applications",
  flatZodInputValidator(submitApplicationBodySchema, jobIdParamSchema),
  async (req, res) => {
    const { jobId: slug } = req.params;
    const { answers } = req.body;

    const company = await resolveCompany(req.params.companyIdOrUsername);
    if (!company) return res.status(404).json({ message: "Company not found" });

    const job = await Job.findOne({ slug, companyId: company._id });
    if (!job) return res.status(404).json({ message: "Job not found" });

    // Resolve applicantId from JWT if a user is logged in (optional auth)
    let applicantId: mongoose.Types.ObjectId | undefined;
    const authHeader = req.headers["authorization"] as string | undefined;
    if (authHeader) {
      const token = authHeader.split(" ")[1];
      if (token) {
        const tokenData: any = require("jsonwebtoken").decode(token);
        if (tokenData?.type === "user" && tokenData?.userId) {
          applicantId = tokenData.userId;
        }
      }
    }

    // Block duplicate applications for logged-in users
    if (applicantId) {
      const existing = await JobApplication.findOne({ jobId: job._id, applicantId });
      if (existing) {
        return res.status(409).json({ message: "You have already applied for this job" });
      }
    }

    const application = await JobApplication.create({
      jobId: job._id,
      answers,
      ...(applicantId && { applicantId }),
    });

    return res.status(201).json(application);
  },
);

// ─────────────────────────────────────────────
// 2. Get All Applications for a Job
// GET /:companyIdOrUsername/jobs/:jobId/applications
// Access: user (owner) | min-admin
// Query: ?status=submitted|reviewing|rejected|hired  &page=1  &limit=20
// ─────────────────────────────────────────────
router.get(
  "/:companyIdOrUsername/jobs/:jobId/applications",
  authenticator(["user", "min-admin"]),
  flatZodInputValidator(null, jobIdParamSchema),
  async (req, res) => {
    const { jobId: slug } = req.params;
    const company =
      req.company ?? (await resolveCompany(req.params.companyIdOrUsername));
    if (!company) return res.status(404).json({ message: "Company not found" });

    const job = await Job.findOne({ slug, companyId: company._id }).select({ _id: 1 });
    if (!job) return res.status(404).json({ message: "Job not found" });

    const { status, page = "1", limit = "20" } = req.query as Record<string, string>;
    const filter: Record<string, any> = { jobId: job._id };
    if (status) filter.status = status;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const [applications, total] = await Promise.all([
      JobApplication.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("applicantId", "name email"),
      JobApplication.countDocuments(filter),
    ]);

    return res.json({ applications, total, page: pageNum, limit: limitNum });
  },
);

// ─────────────────────────────────────────────
// 3. Get Single Application
// GET /:companyIdOrUsername/jobs/:jobId/applications/:applicationId
// Access: user (owner) | min-admin
// ─────────────────────────────────────────────
router.get(
  "/:companyIdOrUsername/jobs/:jobId/applications/:applicationId",
  authenticator(["user", "min-admin"]),
  flatZodInputValidator(null, applicationIdParamSchema),
  async (req, res) => {
    const { jobId: slug, applicationId } = req.params;
    const company =
      req.company ?? (await resolveCompany(req.params.companyIdOrUsername));
    if (!company) return res.status(404).json({ message: "Company not found" });

    const job = await Job.findOne({ slug, companyId: company._id }).select({ _id: 1 });
    if (!job) return res.status(404).json({ message: "Job not found" });

    const application = await JobApplication.findOne({
      _id: applicationId,
      jobId: job._id,
    }).populate("applicantId", "name email phoneNumber");

    if (!application) return res.status(404).json({ message: "Application not found" });

    return res.json(application);
  },
);

// ─────────────────────────────────────────────
// 4. Update Application Status
// PATCH /:companyIdOrUsername/jobs/:jobId/applications/:applicationId/status
// Access: user (owner) | min-admin
// ─────────────────────────────────────────────
router.patch(
  "/:companyIdOrUsername/jobs/:jobId/applications/:applicationId/status",
  authenticator(["user", "min-admin"]),
  flatZodInputValidator(updateApplicationStatusBodySchema, applicationIdParamSchema),
  async (req, res) => {
    const { jobId: slug, applicationId } = req.params;
    const { status } = req.body;
    const company =
      req.company ?? (await resolveCompany(req.params.companyIdOrUsername));
    if (!company) return res.status(404).json({ message: "Company not found" });

    const job = await Job.findOne({ slug, companyId: company._id }).select({ _id: 1 });
    if (!job) return res.status(404).json({ message: "Job not found" });

    const updatedApplication = await JobApplication.findOneAndUpdate(
      { _id: applicationId, jobId: job._id },
      { $set: { status } },
      { new: true },
    );
    if (!updatedApplication) return res.status(404).json({ message: "Application not found" });

    return res.json(updatedApplication);
  },
);

// ─────────────────────────────────────────────
// 5. Delete Application
// DELETE /:companyIdOrUsername/jobs/:jobId/applications/:applicationId
// Access: user (owner) | min-admin
// ─────────────────────────────────────────────
router.delete(
  "/:companyIdOrUsername/jobs/:jobId/applications/:applicationId",
  authenticator(["user", "min-admin"]),
  flatZodInputValidator(null, applicationIdParamSchema),
  async (req, res) => {
    const { jobId: slug, applicationId } = req.params;
    const company =
      req.company ?? (await resolveCompany(req.params.companyIdOrUsername));
    if (!company) return res.status(404).json({ message: "Company not found" });

    const job = await Job.findOne({ slug, companyId: company._id }).select({ _id: 1 });
    if (!job) return res.status(404).json({ message: "Job not found" });

    const application = await JobApplication.findOneAndDelete({ _id: applicationId, jobId: job._id });
    if (!application) return res.status(404).json({ message: "Application not found" });

    return res.json({ message: "Application deleted successfully" });
  },
);

// ─────────────────────────────────────────────
// 6. Get My Applications
// GET /me/applications
// Access: user
// Query: ?status=submitted|reviewing|rejected|hired  &page=1  &limit=20
// ─────────────────────────────────────────────
router.get(
  "/me/applications",
  authenticator(["user"]),
  async (req, res) => {
    const userId = req.user?._id;
    const { status, page = "1", limit = "20" } = req.query as Record<string, string>;
    const filter: Record<string, any> = { applicantId: userId };
    if (status) filter.status = status;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const [applications, total] = await Promise.all([
      JobApplication.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate({
          path: "jobId",
          select: "title country remoteOption employmentType createdAt",
          populate: { path: "companyId", select: "name userName logoUrl" },
        }),
      JobApplication.countDocuments(filter),
    ]);

    return res.json({ applications, total, page: pageNum, limit: limitNum });
  },
);

// ─────────────────────────────────────────────
// 7. Get Single of My Applications
// GET /me/applications/:applicationId
// Access: user
// ─────────────────────────────────────────────
router.get(
  "/me/applications/:applicationId",
  authenticator(["user"]),
  flatZodInputValidator(null, myApplicationIdParamSchema),
  async (req, res) => {
    const application = await JobApplication.findOne({
      _id: req.params.applicationId,
      applicantId: req.user?._id,
    }).populate({
      path: "jobId",
      select:
        "title country remoteOption employmentType stages applicationForm createdAt",
      populate: {
        path: "companyId",
        select: "name userName logoUrl websiteUrl",
      },
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    return res.json(application);
  },
);

// ─────────────────────────────────────────────
// 8. Withdraw (Delete) My Application
// DELETE /me/applications/:applicationId
// Access: user
// ─────────────────────────────────────────────
router.delete(
  "/me/applications/:applicationId",
  authenticator(["user"]),
  flatZodInputValidator(null, myApplicationIdParamSchema),
  async (req, res) => {
    const application = await JobApplication.findOneAndDelete({
      _id: req.params.applicationId,
      applicantId: req.user?._id,
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    return res.json({ message: "Application withdrawn successfully" });
  },
);

export default router;
