import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import Company, {
  ICompanyDocument,
} from "../../../../database/models/company/company";
import Job from "../../../../database/models/job/job";
import JobApplication from "../../../../database/models/jobApplication/jobApplication";
import JobCategory from "../../../../database/models/jobCategory/jobCategory";
import { flatZodInputValidator } from "../../../../middlewares/inputValidator";
import { uploadDocumentToStorage } from "../../../../util/mediaLibraryUtils/documentUtils";
import {
  submitApplicationBodySchema,
} from "../../../../validators/job/jobApplicationValidator";

const router = express.Router();
const upload = multer();

const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// --- Param schemas ---

const publicCompanyParamSchema = {
  parse: (params: Record<string, string>) => {
    if (!params.userName || params.userName.trim().length === 0) {
      throw new Error("Company username is required");
    }
    return params;
  },
};

const publicJobParamSchema = {
  parse: (params: Record<string, string>) => {
    if (!params.userName || params.userName.trim().length === 0) {
      throw new Error("Company username is required");
    }
    if (!params.slug || params.slug.trim().length === 0) {
      throw new Error("Job slug is required");
    }
    return params;
  },
};

// --- Helper: resolve company by userName ---

async function resolveCompany(
  userName: string,
): Promise<ICompanyDocument | null> {
  return Company.findOne({ userName: userName.trim() });
}

// ================================================================
// 1. GET /api/public/companies/:userName
//    Returns company info + active jobs + categories
//    Access: public
// ================================================================
router.get("/public/companies/:userName", async (req, res) => {
  try {
    const { userName } = req.params;

    const company = await resolveCompany(userName);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Fetch active jobs and categories in parallel
    const [jobs, categories] = await Promise.all([
      Job.find({ companyId: company._id, status: "active" })
        .sort({ createdAt: -1 })
        .select({
          title: 1,
          slug: 1,
          category: 1,
          country: 1,
          remoteOption: 1,
          employmentType: 1,
          description: 1,
          createdAt: 1,
        }),
      JobCategory.find({ companyId: company._id })
        .sort({ name: 1 })
        .select({ name: 1 }),
    ]);

    return res.json({
      company: {
        _id: company._id,
        name: company.name,
        userName: company.userName,
        logoUrl: company.logoUrl,
        description: company.description,
        websiteUrl: company.websiteUrl,
      },
      jobs,
      categories,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ================================================================
// 2. GET /api/public/companies/:userName/jobs/:slug
//    Returns single job detail + application form + company info
//    Access: public
// ================================================================
router.get("/public/companies/:userName/jobs/:slug", async (req, res) => {
  try {
    const { userName, slug } = req.params;

    const company = await resolveCompany(userName);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const job = await Job.findOne({
      slug,
      companyId: company._id,
      status: "active",
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    return res.json({
      job,
      company: {
        name: company.name,
        userName: company.userName,
        logoUrl: company.logoUrl,
        websiteUrl: company.websiteUrl,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ================================================================
// 3. POST /api/public/companies/:userName/jobs/:slug/upload-document
//    Upload a file (resume, cover letter, etc.) before applying
//    Access: public
// ================================================================
router.post(
  "/public/companies/:userName/jobs/:slug/upload-document",
  upload.any(),
  async (req, res) => {
    try {
      const { userName, slug } = req.params;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({
          message:
            "No files provided. Send files using their fieldId as the field name.",
        });
      }

      const company = await resolveCompany(userName);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      const job = await Job.findOne({
        slug,
        companyId: company._id,
        status: "active",
      });
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Validate every file before uploading
      for (const file of files) {
        if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(file.mimetype)) {
          return res.status(400).json({
            message: `Unsupported file type for field '${file.fieldname}'. Allowed: PDF, DOC, DOCX`,
          });
        }
        if (file.buffer.byteLength > MAX_FILE_SIZE) {
          return res.status(400).json({
            message: `File too large for field '${file.fieldname}'. Maximum size is 10 MB`,
          });
        }
      }

      // Upload all files in parallel
      const uploadResults = await Promise.all(
        files.map(async (file) => {
          const url = await uploadDocumentToStorage(
            file.originalname,
            file.buffer,
            job._id.toString(),
            "job-applications",
            file.originalname,
          );
          return { fieldId: file.fieldname, url };
        }),
      );

      const urlMap = uploadResults.reduce<Record<string, string>>(
        (acc, { fieldId, url }) => {
          acc[fieldId] = url;
          return acc;
        },
        {},
      );

      return res.json(urlMap);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

// ================================================================
// 4. POST /api/public/companies/:userName/jobs/:slug/apply
//    Submit a job application
//    Access: public (optional auth for duplicate detection)
// ================================================================
router.post(
  "/public/companies/:userName/jobs/:slug/apply",
  flatZodInputValidator(submitApplicationBodySchema),
  async (req, res) => {
    try {
      const { userName, slug } = req.params;
      const { answers } = req.body;

      const company = await resolveCompany(userName);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      const job = await Job.findOne({
        slug,
        companyId: company._id,
        status: "active",
      });
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Optional: extract applicantId from JWT if present
      let applicantId: mongoose.Types.ObjectId | undefined;
      const authHeader = req.headers["authorization"] as string | undefined;
      if (authHeader) {
        const token = authHeader.split(" ")[1];
        if (token) {
          try {
            const tokenData: any = require("jsonwebtoken").decode(token);
            if (tokenData?.type === "user" && tokenData?.userId) {
              applicantId = tokenData.userId;
            }
          } catch {
            // Invalid token — proceed as guest
          }
        }
      }

      // Block duplicate applications for logged-in users
      if (applicantId) {
        const existing = await JobApplication.findOne({
          jobId: job._id,
          applicantId,
        });
        if (existing) {
          return res
            .status(409)
            .json({ message: "You have already applied for this job" });
        }
      }

      const application = await JobApplication.create({
        jobId: job._id,
        answers,
        ...(applicantId && { applicantId }),
      });

      return res.status(201).json({
        application: {
          _id: application._id,
          status: application.status,
          createdAt: application.createdAt,
        },
      });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

export default router;
