import express from "express";
import { authenticator } from "../../../../middlewares/authenticator";
import { flatZodInputValidator } from "../../../../middlewares/inputValidator";
import { companyIdOrUsernameParamSchema } from "../../../../validators/job/jobValidator";
import Subscription from "../../../../database/models/subscription/subscription";
import { PLAN_CONFIG } from "../../../../constants/jobEnums";
import Job from "../../../../database/models/job/job";

const router = express.Router();

// ─── GET /:companyIdOrUsername/billing/subscription ──────────────────────────
// Get current plan info + active subscription for a company

router.get(
  "/:companyIdOrUsername/billing/subscription",
  authenticator(["user"]),
  flatZodInputValidator(null, companyIdOrUsernameParamSchema),
  async (req, res) => {
    const company = req.company;
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const planConfig = PLAN_CONFIG[company.plan || "free"];

    const activeJobCount = await Job.countDocuments({
      companyId: company._id,
      status: "active",
    });

    const subscription = await Subscription.findOne({
      companyId: company._id,
      status: "active",
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      plan: company.plan || "free",
      planExpiresAt: company.planExpiresAt,
      planConfig,
      activeJobCount,
      subscription: subscription || null,
    });
  },
);

// ─── GET /:companyIdOrUsername/billing/transactions ──────────────────────────
// List all subscription transactions for a company

router.get(
  "/:companyIdOrUsername/billing/transactions",
  authenticator(["user"]),
  flatZodInputValidator(null, companyIdOrUsernameParamSchema),
  async (req, res) => {
    const company = req.company;
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const transactions = await Subscription.find({
      companyId: company._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({ transactions });
  },
);

export default router;
