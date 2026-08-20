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
