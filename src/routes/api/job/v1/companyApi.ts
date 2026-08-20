import mongoose from "mongoose";
import crypto from "crypto";
import express from "express";
import Company, {
  ICompanyDocument,
} from "../../../../database/models/company/company";
import Job from "../../../../database/models/job/job";
import JobApplication from "../../../../database/models/jobApplication/jobApplication";
import JobCategory from "../../../../database/models/jobCategory/jobCategory";
import TeamInvite from "../../../../database/models/teamInvite/teamInvite";
import User from "../../../../database/models/user/user";
import { authenticator } from "../../../../middlewares/authenticator";
import { flatZodInputValidator } from "../../../../middlewares/inputValidator";
import { generateUsername } from "../../../../util/stringUtils";
import {
  companyUsernameQuerySchema,
  createCompanyBodySchema,
  updateCompanyBodySchema,
  joinTeamBodySchema,
} from "../../../../validators/job/companyValidator";
import { companyIdOrUsernameParamSchema } from "../../../../validators/job/jobValidator";
import { PLAN_CONFIG } from "../../../../constants/jobEnums";

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

async function generateUniqueCompanyUsername(name: string): Promise<string> {
  const baseUsername = generateUsername(name);
  let userName = baseUsername;
  let count = 1;
  while (true) {
    const existing = await Company.findOne({ userName });
    if (!existing) {
      return userName;
    }
    userName = `${baseUsername}-${count}`;
    count++;
  }
}

const DEFAULT_CATEGORIES = [
  "Technology",
  "Marketing",
  "Finance",
  "Human Resources",
  "Operations",
  "Design",
  "Sales",
  "Customer Service",
];

async function seedCompanyCategories(companyId: mongoose.Types.ObjectId) {
  const categories = DEFAULT_CATEGORIES.map((name) => ({
    name,
    companyId,
  }));
  await JobCategory.insertMany(categories, { ordered: false }).catch(() => {
    // Ignore duplicate key errors (idempotent seeding)
  });
}

// ─────────────────────────────────────────────
// 1. Get All Companies
// GET /companies
// Access: min-admin
// ─────────────────────────────────────────────
router.get(
  "/companies",
  authenticator(["min-admin"]),
  async (req, res) => {
    const { page = "1", limit = "20", search } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = {};
    if (search) {
      const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"); // Escape regex characters
      filter.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { userName: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    const [companies, total] = await Promise.all([
      Company.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("creatorUserId", "name email"),
      Company.countDocuments(filter),
    ]);

    return res.json({ companies, total, page: pageNum, limit: limitNum });
  },
);

// ─────────────────────────────────────────────
// 3. Get My Company
// GET /companies/me
// Access: user
// ─────────────────────────────────────────────
router.get("/companies/me", authenticator(["user"]), async (req, res) => {
  const company = await Company.findOne({ creatorUserId: req.user?._id });
  if (!company) return res.status(404).json({ message: "Company not found" });
  return res.json(company);
});

// ─────────────────────────────────────────────
// Get My Companies (list)
// GET /companies/mine
// Access: user
// ─────────────────────────────────────────────
router.get("/companies/mine", authenticator(["user"]), async (req, res) => {
  const companies = await Company.find({ creatorUserId: req.user?._id }).sort({
    createdAt: -1,
  });
  return res.json(companies);
});

// ─────────────────────────────────────────────
// 2. Check Company Username Availability
// GET /companies/username/check?username=
// Access: public
// ─────────────────────────────────────────────
router.get(
  "/companies/username/check",
  flatZodInputValidator(null, null, companyUsernameQuerySchema),
  async (req, res) => {
    const username = (req.query as Record<string, string>).username;
    const existing = await Company.findOne({ userName: username });
    return res.json({ available: !existing });
  },
);

// ─────────────────────────────────────────────
// 4. Create Company
// POST /companies
// Access: user
// ─────────────────────────────────────────────
router.post(
  "/companies",
  authenticator(["user"]),
  flatZodInputValidator(createCompanyBodySchema),
  async (req, res) => {
    const userId = req.user?._id;
    const existing = await Company.findOne({ creatorUserId: userId });
    if (existing) {
      return res.status(400).json({ message: "You already have a company" });
    }

    const { name, description, websiteUrl, logoUrl, userName } = req.body;

    // use the provided username or auto-generate one from the company name
    let finalUserName: string;
    if (userName) {
      const userNameTaken = await Company.findOne({ userName });
      if (userNameTaken) {
        return res
          .status(400)
          .json({ message: "Company username is already taken" });
      }
      finalUserName = userName;
    } else {
      finalUserName = await generateUniqueCompanyUsername(name);
    }

    const company = await Company.create({
      name,
      userName: finalUserName,
      creatorUserId: userId,
      description,
      websiteUrl,
      logoUrl,
    });

    await seedCompanyCategories(company._id);

    return res.status(201).json(company);
  },
);

// ─────────────────────────────────────────────
// 5. Update Company
// PUT /companies/:companyIdOrUsername
// Access: user (owner) | min-admin
// ─────────────────────────────────────────────
router.put(
  "/companies/:companyIdOrUsername",
  authenticator(["user", "min-admin"]),
  flatZodInputValidator(
    updateCompanyBodySchema,
    companyIdOrUsernameParamSchema,
  ),
  async (req, res) => {
    const { companyIdOrUsername } = req.params;
    const company =
      req.company ?? (await resolveCompany(companyIdOrUsername));
    if (!company) return res.status(404).json({ message: "Company not found" });

    if (req.user && !company.creatorUserId.equals(req.user._id)) {
      return res
        .status(403)
        .json({ message: "You are not the owner of this company" });
    }

    const { name, description, websiteUrl, logoUrl } = req.body;
    if (name) company.name = name;
    if (description !== undefined) company.description = description;
    if (websiteUrl !== undefined) company.websiteUrl = websiteUrl;
    if (logoUrl !== undefined) company.logoUrl = logoUrl;
    await company.save();

    return res.json(company);
  },
);

// ─────────────────────────────────────────────
// 6. Delete Company
// DELETE /companies/:companyIdOrUsername
// Access: user (owner) | min-admin
// ─────────────────────────────────────────────
router.delete(
  "/companies/:companyIdOrUsername",
  authenticator(["user", "min-admin"]),
  flatZodInputValidator(null, companyIdOrUsernameParamSchema),
  async (req, res) => {
    const { companyIdOrUsername } = req.params;
    const company =
      req.company ?? (await resolveCompany(companyIdOrUsername));
    if (!company) return res.status(404).json({ message: "Company not found" });

    if (req.user && !company.creatorUserId.equals(req.user._id)) {
      return res
        .status(403)
        .json({ message: "You are not the owner of this company" });
    }

    const jobs = await Job.find({ companyId: company._id }, { _id: 1 });
    const jobIds = jobs.map((job) => job._id);
    await JobApplication.deleteMany({ jobId: { $in: jobIds } });
    await Job.deleteMany({ companyId: company._id });
    await JobCategory.deleteMany({ companyId: company._id });
    await company.deleteOne();

    return res.json({ message: "success" });
  },
);

// ─────────────────────────────────────────────
// 7. Get Single Company
// GET /companies/:companyIdOrUsername
// Access: user (owner) | min-admin
// ─────────────────────────────────────────────
router.get(
  "/companies/:companyIdOrUsername",
  authenticator(["user", "min-admin"]),
  flatZodInputValidator(null, companyIdOrUsernameParamSchema),
  async (req, res) => {
    const { companyIdOrUsername } = req.params;
    const company =
      req.company ?? (await resolveCompany(companyIdOrUsername));
    if (!company) return res.status(404).json({ message: "Company not found" });

    // Populate creatorUserId with basic fields
    await company.populate("creatorUserId", "name email");

    return res.json(company);
  },
);

// ─────────────────────────────────────────────
// 8. Get Team Members
// GET /companies/:companyIdOrUsername/team
// Access: user (owner or member) | min-admin
// ─────────────────────────────────────────────
router.get(
  "/companies/:companyIdOrUsername/team",
  authenticator(["user", "min-admin"]),
  flatZodInputValidator(null, companyIdOrUsernameParamSchema),
  async (req, res) => {
    const { companyIdOrUsername } = req.params;
    const company =
      req.company ?? (await resolveCompany(companyIdOrUsername));
    if (!company) return res.status(404).json({ message: "Company not found" });

    await company.populate("creatorUserId", "name email profilePicture");
    await company.populate("teamMemberUserIds", "name email profilePicture");

    return res.json({
      owner: company.creatorUserId,
      members: company.teamMemberUserIds,
    });
  },
);

// ─────────────────────────────────────────────
// 9. Generate Team Invite Link
// POST /companies/:companyIdOrUsername/team/invite
// Access: user (owner only) | min-admin
// ─────────────────────────────────────────────
router.post(
  "/companies/:companyIdOrUsername/team/invite",
  authenticator(["user", "min-admin"]),
  flatZodInputValidator(null, companyIdOrUsernameParamSchema),
  async (req, res) => {
    const { companyIdOrUsername } = req.params;
    const company =
      req.company ?? (await resolveCompany(companyIdOrUsername));
    if (!company) return res.status(404).json({ message: "Company not found" });

    if (req.user && !company.creatorUserId.equals(req.user._id)) {
      return res
        .status(403)
        .json({ message: "Only the company owner can invite members" });
    }

    const planConfig = PLAN_CONFIG[company.plan || "free"];
    if (company.teamMemberUserIds.length >= planConfig.teamMembers) {
      return res
        .status(403)
        .json({ message: "Upgrade your plan to add team members" });
    }

    const token = crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days

    await TeamInvite.create({
      token,
      companyId: company._id,
      createdBy: req.user?._id,
      expiresAt,
    });

    const url = `${req.protocol}://${req.get("host")}/companies/${company.userName}/team/join?token=${token}`;

    return res.json({ url });
  },
);

// ─────────────────────────────────────────────
// 10. Join Team via Invite
// POST /companies/:companyIdOrUsername/team/join
// Access: user (logged in)
// ─────────────────────────────────────────────
router.post(
  "/companies/:companyIdOrUsername/team/join",
  authenticator(["user"]),
  flatZodInputValidator(joinTeamBodySchema, companyIdOrUsernameParamSchema),
  async (req, res) => {
    const { companyIdOrUsername } = req.params;
    const company =
      req.company ?? (await resolveCompany(companyIdOrUsername));
    if (!company) return res.status(404).json({ message: "Company not found" });

    const { token } = req.body;

    const invite = await TeamInvite.findOne({ token });
    if (!invite) {
      return res.status(400).json({ message: "Invalid invite link" });
    }

    if (invite.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invite link has expired" });
    }

    if (invite.usedBy) {
      return res.status(400).json({ message: "Invite link has already been used" });
    }

    if (!invite.companyId.equals(company._id)) {
      return res.status(400).json({ message: "Invite link is for a different company" });
    }

    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (company.creatorUserId.equals(userId)) {
      return res.status(400).json({ message: "You are the owner of this company" });
    }

    if (company.teamMemberUserIds.some((id: mongoose.Types.ObjectId) => id.equals(userId))) {
      return res.status(400).json({ message: "You are already a member of this company" });
    }

    const planConfig = PLAN_CONFIG[company.plan || "free"];
    if (company.teamMemberUserIds.length >= planConfig.teamMembers) {
      return res
        .status(403)
        .json({ message: "This company has reached its team member limit. Upgrade to add more." });
    }

    company.teamMemberUserIds.push(userId);
    await company.save();

    invite.usedBy = userId;
    await invite.save();

    return res.json({ message: "Joined team successfully" });
  },
);

export default router;
