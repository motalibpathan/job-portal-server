import mongoose from "mongoose";
import express from "express";
import Company, {
  ICompanyDocument,
} from "../../../../database/models/company/company";
import Job from "../../../../database/models/job/job";
import JobApplication from "../../../../database/models/jobApplication/jobApplication";
import { authenticator } from "../../../../middlewares/authenticator";
import { flatZodInputValidator } from "../../../../middlewares/inputValidator";
import {
  createJobBodySchema,
  updateJobBodySchema,
  updateStagesBodySchema,
  updateApplicationFormBodySchema,
  companyIdOrUsernameParamSchema,
  jobIdParamSchema,
  publicJobIdParamSchema,
  jobSearchQuerySchema,
} from "../../../../validators/job/jobValidator";
import { generateJobSlug } from "../../../../util/stringUtils";

const router = express.Router();

// Helper: resolve company from params (used by admin path where req.company is not set)
async function resolveCompany(
  companyIdOrUsername: string,
): Promise<ICompanyDocument | null> {
  const isObjectId = mongoose.isObjectIdOrHexString(companyIdOrUsername);
  return Company.findOne(
    isObjectId ? { _id: companyIdOrUsername } : { userName: companyIdOrUsername },
  );
}

// Helper: generate a unique slug within a company
async function generateUniqueJobSlug(
  companyId: mongoose.Types.ObjectId,
  title: string,
  excludeJobId?: mongoose.Types.ObjectId,
): Promise<string> {
  const baseSlug = generateJobSlug(title);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query: Record<string, any> = { companyId, slug };
    if (excludeJobId) query._id = { $ne: excludeJobId };

    const existing = await Job.findOne(query).select({ _id: 1 });
    if (!existing) return slug;

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// ─────────────────────────────────────────────
// 0a. Public Job Search
// GET /jobs
// Access: public
// Query: ?search=&categoryId=&country=&remoteOption=&employmentType=&page=&limit=
// ─────────────────────────────────────────────
router.get(
  "/jobs",
  flatZodInputValidator(null, null, jobSearchQuerySchema),
  async (req, res) => {
    const {
      search,
      categoryId,
      country,
      remoteOption,
      employmentType,
      page,
      limit,
    } = req.query as Record<string, any>;
    const pageNum = page ?? 1;
    const limitNum = Math.min(limit ?? 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = {};
    if (search) {
      const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      filter.$or = [
        { title: { $regex: escapedSearch, $options: "i" } },
        { description: { $regex: escapedSearch, $options: "i" } },
      ];
    }
    if (categoryId) filter["category.categoryId"] = categoryId;
    if (country) filter.country = { $regex: country, $options: "i" };
    if (remoteOption) filter.remoteOption = remoteOption;
    if (employmentType) filter.employmentType = employmentType;

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("companyId", "name userName logoUrl"),
      Job.countDocuments(filter),
    ]);

    return res.json({ jobs, total, page: pageNum, limit: limitNum });
  },
);

// ─────────────────────────────────────────────
// 0b. Public Job Detail
// GET /jobs/:jobId
// Access: public
// ─────────────────────────────────────────────
router.get(
  "/jobs/:jobId",
  flatZodInputValidator(null, publicJobIdParamSchema),
  async (req, res) => {
    const job = await Job.findById(req.params.jobId).populate(
      "companyId",
      "name userName logoUrl websiteUrl description",
    );
    if (!job) return res.status(404).json({ message: "Job not found" });
    return res.json(job);
  },
);

// ─────────────────────────────────────────────
// 1. Create a Job
// POST /:companyIdOrUsername/jobs
// Access: user (owner) | min-admin
// ─────────────────────────────────────────────
router.post(
  "/:companyIdOrUsername/jobs",
  authenticator(["user", "min-admin"]),
  flatZodInputValidator(createJobBodySchema, companyIdOrUsernameParamSchema),
  async (req, res) => {
    const company =
      req.company ?? (await resolveCompany(req.params.companyIdOrUsername));
    if (!company) return res.status(404).json({ message: "Company not found" });

    const slug = await generateUniqueJobSlug(company._id, req.body.title);
    const job = await Job.create({ ...req.body, slug, companyId: company._id });
    return res.status(201).json(job);
  },
);

// ─────────────────────────────────────────────
// 2. Get All Jobs for a Company
// GET /:companyIdOrUsername/jobs
// Access: public
// ─────────────────────────────────────────────
router.get(
  "/:companyIdOrUsername/jobs",
  flatZodInputValidator(null, companyIdOrUsernameParamSchema),
  async (req, res) => {
    const company = await resolveCompany(req.params.companyIdOrUsername);
    if (!company) return res.status(404).json({ message: "Company not found" });

    const jobs = await Job.find({ companyId: company._id }).sort({ createdAt: -1 });
    return res.json(jobs);
  },
);

// ─────────────────────────────────────────────
// 3. Get Single Job
// GET /:companyIdOrUsername/jobs/:jobId
// Access: public
// ─────────────────────────────────────────────
router.get(
  "/:companyIdOrUsername/jobs/:jobId",
  flatZodInputValidator(null, jobIdParamSchema),
  async (req, res) => {
    const { jobId: slug } = req.params;
    const company = await resolveCompany(req.params.companyIdOrUsername);
    if (!company) return res.status(404).json({ message: "Company not found" });

    const job = await Job.findOne({ slug, companyId: company._id }).populate(
      "companyId",
      "name userName logoUrl",
    );
    if (!job) return res.status(404).json({ message: "Job not found" });

    return res.json(job);
  },
);

// ─────────────────────────────────────────────
// 4. Update Job
// PUT /:companyIdOrUsername/jobs/:jobId
// Access: user (owner) | min-admin
// ─────────────────────────────────────────────
router.put(
  "/:companyIdOrUsername/jobs/:jobId",
  authenticator(["user", "min-admin"]),
  flatZodInputValidator(updateJobBodySchema, jobIdParamSchema),
  async (req, res) => {
    const { jobId: slug } = req.params;
    const company =
      req.company ?? (await resolveCompany(req.params.companyIdOrUsername));
    if (!company) return res.status(404).json({ message: "Company not found" });

    const job = await Job.findOne({ slug, companyId: company._id });
    if (!job) return res.status(404).json({ message: "Job not found" });

    const updateData: Record<string, any> = { ...req.body };
    if (req.body.title && req.body.title !== job.title) {
      updateData.slug = await generateUniqueJobSlug(
        company._id,
        req.body.title,
        job._id,
      );
    }

    const updatedJob = await Job.findOneAndUpdate(
      { _id: job._id },
      { $set: updateData },
      { new: true },
    );
    if (!updatedJob) return res.status(404).json({ message: "Job not found" });

    return res.json(updatedJob);
  },
);

// ─────────────────────────────────────────────
// 5. Delete Job
// DELETE /:companyIdOrUsername/jobs/:jobId
// Access: user (owner) | min-admin
// ─────────────────────────────────────────────
router.delete(
  "/:companyIdOrUsername/jobs/:jobId",
  authenticator(["user", "min-admin"]),
  flatZodInputValidator(null, jobIdParamSchema),
  async (req, res) => {
    const { jobId: slug } = req.params;
    const company =
      req.company ?? (await resolveCompany(req.params.companyIdOrUsername));
    if (!company) return res.status(404).json({ message: "Company not found" });

    const job = await Job.findOneAndDelete({ slug, companyId: company._id });
    if (!job) return res.status(404).json({ message: "Job not found" });

    return res.json({ message: "Job deleted successfully" });
  },
);

// ─────────────────────────────────────────────
// 6. Update Hiring Stages
// PUT /:companyIdOrUsername/jobs/:jobId/stages
// Access: user (owner) | min-admin
// ─────────────────────────────────────────────
router.put(
  "/:companyIdOrUsername/jobs/:jobId/stages",
  authenticator(["user", "min-admin"]),
  flatZodInputValidator(updateStagesBodySchema, jobIdParamSchema),
  async (req, res) => {
    const { jobId: slug } = req.params;
    const { stages } = req.body;
    const company =
      req.company ?? (await resolveCompany(req.params.companyIdOrUsername));
    if (!company) return res.status(404).json({ message: "Company not found" });

    const updatedJob = await Job.findOneAndUpdate(
      { slug, companyId: company._id },
      { $set: { stages } },
      { new: true },
    );
    if (!updatedJob) return res.status(404).json({ message: "Job not found" });

    return res.json(updatedJob);
  },
);

// ─────────────────────────────────────────────
// 7. Update Application Form
// PUT /:companyIdOrUsername/jobs/:jobId/application-form
// Access: user (owner) | min-admin
// ─────────────────────────────────────────────
router.put(
  "/:companyIdOrUsername/jobs/:jobId/application-form",
  authenticator(["user", "min-admin"]),
  flatZodInputValidator(updateApplicationFormBodySchema, jobIdParamSchema),
  async (req, res) => {
    const { jobId: slug } = req.params;
    const { applicationForm } = req.body;
    const company =
      req.company ?? (await resolveCompany(req.params.companyIdOrUsername));
    if (!company) return res.status(404).json({ message: "Company not found" });

    const updatedJob = await Job.findOneAndUpdate(
      { slug, companyId: company._id },
      { $set: { applicationForm } },
      { new: true },
    );
    if (!updatedJob) return res.status(404).json({ message: "Job not found" });

    return res.json(updatedJob);
  },
);

// ─────────────────────────────────────────────
// 8. Get Company Stats
// GET /:companyIdOrUsername/stats
// Access: user (owner) | min-admin
// ─────────────────────────────────────────────
router.get(
  "/:companyIdOrUsername/stats",
  authenticator(["user", "min-admin"]),
  flatZodInputValidator(null, companyIdOrUsernameParamSchema),
  async (req, res) => {
    const company =
      req.company ?? (await resolveCompany(req.params.companyIdOrUsername));
    if (!company) return res.status(404).json({ message: "Company not found" });

    const totalJobs = await Job.countDocuments({ companyId: company._id });
    const activeJobs = await Job.countDocuments({
      companyId: company._id,
      status: "active",
    });
    const closedJobs = await Job.countDocuments({
      companyId: company._id,
      status: "closed",
    });

    const jobs = await Job.find({ companyId: company._id }, { _id: 1 });
    const jobIds = jobs.map((job) => job._id);

    const totalApplications = await JobApplication.countDocuments({
      jobId: { $in: jobIds },
    });

    const applicationsByStatus = await JobApplication.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const recentApplications = await JobApplication.find({
      jobId: { $in: jobIds },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("jobId", "title")
      .populate("applicantId", "name email profilePicture");

    return res.json({
      totalJobs,
      activeJobs,
      closedJobs,
      totalApplications,
      applicationsByStatus: applicationsByStatus.reduce(
        (acc, item) => {
          acc[item._id] = item.count;
          return acc;
        },
        {} as Record<string, number>,
      ),
      recentApplications,
    });
  },
);

export default router;
