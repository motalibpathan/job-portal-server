import { z } from "zod";
import { jobApplicationStatuses } from "../../constants/jobEnums";
import { getZodMongoId } from "../commonValidator";

export const submitApplicationBodySchema = z.object({
  answers: z
    .array(
      z.object({
        fieldId: z.string().min(1).trim(),
        value: z.string().min(1).trim(),
      }),
    )
    .min(1, "At least one answer is required"),
});

export const updateApplicationStatusBodySchema = z.object({
  status: z.enum(jobApplicationStatuses as [string, ...string[]]),
});

export const applicationIdParamSchema = z.object({
  companyIdOrUsername: z.string().min(1).trim(),
  jobId: z.string().min(1).trim(),
  applicationId: z.string().min(1).trim(),
});

export const myApplicationIdParamSchema = z.object({
  applicationId: getZodMongoId("Invalid Application ID"),
});
