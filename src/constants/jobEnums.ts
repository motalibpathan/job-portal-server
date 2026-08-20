export const JOB_REMOTE_OPTIONS = {
  ON_SITE: "on-site" as const,
  HYBRID: "hybrid" as const,
  REMOTE: "remote" as const,
};

export const jobRemoteOptions = Object.values(JOB_REMOTE_OPTIONS);
export type TJobRemoteOption = (typeof jobRemoteOptions)[number];

export const JOB_EMPLOYMENT_TYPES = {
  FULL_TIME: "full-time" as const,
  PART_TIME: "part-time" as const,
  CONTRACT: "contract" as const,
  INTERNSHIP: "internship" as const,
  TEMPORARY: "temporary" as const,
  FREELANCE: "freelance" as const,
};

export const jobEmploymentTypes = Object.values(JOB_EMPLOYMENT_TYPES);
export type TJobEmploymentType = (typeof jobEmploymentTypes)[number];

export const JOB_APPLICATION_FIELD_TYPES = {
  SHORT_TEXT: "short-text" as const,
  LONG_TEXT: "long-text" as const,
  PHONE_NUMBER: "phone-number" as const,
  EMAIL: "email" as const,
  LINK: "link" as const,
  DOCUMENT_UPLOAD: "document-upload" as const,
};

export const jobApplicationFieldTypes = Object.values(
  JOB_APPLICATION_FIELD_TYPES,
);
export type TJobApplicationFieldType =
  (typeof jobApplicationFieldTypes)[number];

export const JOB_APPLICATION_STATUSES = {
  SUBMITTED: "submitted" as const,
  REVIEWING: "reviewing" as const,
  REJECTED: "rejected" as const,
  HIRED: "hired" as const,
};

export const jobApplicationStatuses = Object.values(JOB_APPLICATION_STATUSES);
export type TJobApplicationStatus = (typeof jobApplicationStatuses)[number];

export const JOB_HIRING_STAGES = {
  APPLIED: "applied" as const,
  SCREENING: "screening" as const,
  INTERVIEW: "interview" as const,
  EVALUATION: "evaluation" as const,
  OFFER: "offer" as const,
  HIRED: "hired" as const,
  ARCHIVE: "archive" as const,
};

export const jobHiringStages = Object.values(JOB_HIRING_STAGES);
export type TJobHiringStage = (typeof jobHiringStages)[number];

// ─── Company Plan ────────────────────────────────────────────────────────────

export const COMPANY_PLAN = {
  FREE: "free" as const,
  BOOTSTRAP: "bootstrap" as const,
  STARTUP: "startup" as const,
  BUSINESS: "business" as const,
};

export const companyPlans = Object.values(COMPANY_PLAN);
export type TCompanyPlan = (typeof companyPlans)[number];

export const COMPANY_PLAN_TEXT_MAP: Record<TCompanyPlan, string> = {
  [COMPANY_PLAN.FREE]: "Free",
  [COMPANY_PLAN.BOOTSTRAP]: "Bootstrap",
  [COMPANY_PLAN.STARTUP]: "Startup",
  [COMPANY_PLAN.BUSINESS]: "Business",
};

export const PLAN_CONFIG: Record<
  TCompanyPlan,
  { price: number; activeJobLimit: number; teamMembers: number }
> = {
  [COMPANY_PLAN.FREE]: { price: 0, activeJobLimit: 2, teamMembers: 0 },
  [COMPANY_PLAN.BOOTSTRAP]: { price: 29, activeJobLimit: 3, teamMembers: Infinity },
  [COMPANY_PLAN.STARTUP]: { price: 49, activeJobLimit: 10, teamMembers: Infinity },
  [COMPANY_PLAN.BUSINESS]: { price: 129, activeJobLimit: 20, teamMembers: Infinity },
};

// ─── Job Status ──────────────────────────────────────────────────────────────

export const JOB_STATUS = {
  ACTIVE: "active" as const,
  DRAFT: "draft" as const,
  CLOSED: "closed" as const,
};

export const jobStatuses = Object.values(JOB_STATUS);
export type TJobStatus = (typeof jobStatuses)[number];

export const JOB_STATUS_TEXT_MAP: Record<TJobStatus, string> = {
  [JOB_STATUS.ACTIVE]: "Active",
  [JOB_STATUS.DRAFT]: "Draft",
  [JOB_STATUS.CLOSED]: "Closed",
};

// ─── Subscription Status ─────────────────────────────────────────────────────

export const SUBSCRIPTION_STATUS = {
  ACTIVE: "active" as const,
  CANCELLED: "cancelled" as const,
  EXPIRED: "expired" as const,
};

export const subscriptionStatuses = Object.values(SUBSCRIPTION_STATUS);
export type TSubscriptionStatus = (typeof subscriptionStatuses)[number];

// ─── Billing Cycle ───────────────────────────────────────────────────────────

export const BILLING_CYCLE = {
  MONTHLY: "monthly" as const,
  YEARLY: "yearly" as const,
};

export const billingCycles = Object.values(BILLING_CYCLE);
export type TBillingCycle = (typeof billingCycles)[number];
