import mongoose from "mongoose";
import express from "express";
import JobCategory from "../../../../database/models/jobCategory/jobCategory";
import { authenticator } from "../../../../middlewares/authenticator";
import { flatZodInputValidator } from "../../../../middlewares/inputValidator";
import {
  createJobCategoryBodySchema,
  updateJobCategoryBodySchema,
  jobCategoryIdParamSchema,
} from "../../../../validators/job/jobCategoryValidator";

const router = express.Router();

function isCompanyOwnerOrMember(
  company: { creatorUserId: mongoose.Types.ObjectId; teamMemberUserIds: mongoose.Types.ObjectId[] },
  userId: mongoose.Types.ObjectId,
): boolean {
  return (
    company.creatorUserId.equals(userId) ||
    company.teamMemberUserIds.some((id) => id.equals(userId))
  );
}

// ─────────────────────────────────────────────
// 1. Get All Job Categories for a Company
// GET /companies/:companyIdOrUsername/job-categories
// Access: public
// ─────────────────────────────────────────────
router.get(
  "/companies/:companyIdOrUsername/job-categories",
  async (req, res) => {
    const { companyIdOrUsername } = req.params;
    const isObjectId = mongoose.isObjectIdOrHexString(companyIdOrUsername);
    const filter: Record<string, any> = isObjectId
      ? { companyId: companyIdOrUsername }
      : {};

    // If not an ObjectId, we need to resolve the username to companyId
    if (!isObjectId) {
      const { default: Company } = await import(
        "../../../../database/models/company/company"
      );
      const company = await Company.findOne({ userName: companyIdOrUsername });
      if (!company) return res.status(404).json({ message: "Company not found" });
      filter.companyId = company._id;
    }

    const categories = await JobCategory.find(filter).sort({ name: 1 });
    return res.json(categories);
  },
);

// ─────────────────────────────────────────────
// 2. Get Single Job Category
// GET /job-categories/:categoryId
// Access: public
// ─────────────────────────────────────────────
router.get(
  "/job-categories/:categoryId",
  flatZodInputValidator(null, jobCategoryIdParamSchema),
  async (req, res) => {
    const category = await JobCategory.findById(req.params.categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    return res.json(category);
  },
);

// ─────────────────────────────────────────────
// 3. Create Job Category (per-company)
// POST /companies/:companyIdOrUsername/job-categories
// Access: user (owner) | min-admin
// ─────────────────────────────────────────────
router.post(
  "/companies/:companyIdOrUsername/job-categories",
  authenticator(["user", "min-admin"]),
  flatZodInputValidator(createJobCategoryBodySchema),
  async (req, res) => {
    const { companyIdOrUsername } = req.params;
    const { default: Company } = await import(
      "../../../../database/models/company/company"
    );
    const isObjectId = mongoose.isObjectIdOrHexString(companyIdOrUsername);
    const company = await Company.findOne(
      isObjectId ? { _id: companyIdOrUsername } : { userName: companyIdOrUsername },
    );
    if (!company) return res.status(404).json({ message: "Company not found" });

    // Verify ownership if user
    if (req.user && !isCompanyOwnerOrMember(company, req.user._id)) {
      return res
        .status(403)
        .json({ message: "You are not the owner of this company" });
    }

    const existing = await JobCategory.findOne({
      name: req.body.name,
      companyId: company._id,
    });
    if (existing) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await JobCategory.create({
      name: req.body.name,
      companyId: company._id,
    });
    return res.status(201).json(category);
  },
);

// ─────────────────────────────────────────────
// 4. Update Job Category
// PUT /job-categories/:categoryId
// Access: user (owner) | min-admin
// ─────────────────────────────────────────────
router.put(
  "/job-categories/:categoryId",
  authenticator(["user", "min-admin"]),
  flatZodInputValidator(
    updateJobCategoryBodySchema,
    jobCategoryIdParamSchema,
  ),
  async (req, res) => {
    const category = await JobCategory.findById(req.params.categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Verify ownership if user
    if (req.user) {
      const { default: Company } = await import(
        "../../../../database/models/company/company"
      );
      const company = await Company.findById(category.companyId);
      if (!company || !isCompanyOwnerOrMember(company, req.user._id)) {
        return res
          .status(403)
          .json({ message: "You are not the owner of this company" });
      }
    }

    if (req.body.name) {
      const existing = await JobCategory.findOne({
        name: req.body.name,
        companyId: category.companyId,
        _id: { $ne: category._id },
      });
      if (existing) {
        return res.status(400).json({ message: "Category already exists" });
      }
      category.name = req.body.name;
    }
    await category.save();
    return res.json(category);
  },
);

// ─────────────────────────────────────────────
// 5. Delete Job Category
// DELETE /job-categories/:categoryId
// Access: user (owner) | min-admin
// ─────────────────────────────────────────────
router.delete(
  "/job-categories/:categoryId",
  authenticator(["user", "min-admin"]),
  flatZodInputValidator(null, jobCategoryIdParamSchema),
  async (req, res) => {
    const category = await JobCategory.findById(req.params.categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Verify ownership if user
    if (req.user) {
      const { default: Company } = await import(
        "../../../../database/models/company/company"
      );
      const company = await Company.findById(category.companyId);
      if (!company || !isCompanyOwnerOrMember(company, req.user._id)) {
        return res
          .status(403)
          .json({ message: "You are not the owner of this company" });
      }
    }

    await category.deleteOne();
    return res.json({ message: "success" });
  },
);

export default router;
