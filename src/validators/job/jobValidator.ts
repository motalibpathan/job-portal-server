import { z } from "zod";
import { getZodMongoId } from "../commonValidator";
import {
  jobEmploymentTypes,
  jobRemoteOptions,
  jobApplicationFieldTypes,
} from "../../constants/jobEnums";

export const createJobBodySchema = z.object({
  title: z.string().min(1, "Title is required").trim(),
  category: z.object({
    categoryId: getZodMongoId("Invalid Category ID"),
    categoryName: z.string().min(1, "Category name is required").trim(),
  }),
  description: z.string().min(1, "Description is required").trim(),
  country: z.string().min(1, "Country is required").trim(),
  remoteOption: z.enum(jobRemoteOptions as [string, ...string[]]),
  employmentType: z.enum(jobEmploymentTypes as [string, ...string[]]),
  applicationForm: z.array(
    z.object({
      fieldId: z.string().min(1).trim(),
      label: z.string().min(1).trim(),
      fieldType: z.enum(jobApplicationFieldTypes as [string, ...string[]]),
      required: z.boolean().default(false),
      order: z.number().min(0),
    })
  ).default([]),
  stages: z.array(
    z.object({
      stageId: z.string().min(1).trim(),
      name: z.string().min(1).trim(),
      order: z.number().min(0),
    })
  ).optional(),
});

export const updateJobBodySchema = createJobBodySchema.partial();

export const updateStagesBodySchema = z.object({
  stages: z.array(
    z.object({
      stageId: z.string().min(1).trim(),
      name: z.string().min(1).trim(),
      order: z.number().min(0),
    })
  ),
});

export const updateApplicationFormBodySchema = z.object({
  applicationForm: z.array(
    z.object({
      fieldId: z.string().min(1).trim(),
      label: z.string().min(1).trim(),
      fieldType: z.enum(jobApplicationFieldTypes as [string, ...string[]]),
      required: z.boolean().default(false),
      order: z.number().min(0),
    })
  ),
});

export const companyIdOrUsernameParamSchema = z.object({
  companyIdOrUsername: z.string().min(1, "Company ID or Username is required").trim(),
});

export const jobIdParamSchema = z.object({
  companyIdOrUsername: z.string().min(1, "Company ID or Username is required").trim(),
  jobId: z.string().min(1, "Job slug is required").trim(),
});

export const publicJobIdParamSchema = z.object({
  jobId: getZodMongoId("Invalid Job ID"),
});

export const jobSearchQuerySchema = z.object({
  search: z.string().trim().optional(),
  categoryId: getZodMongoId("Invalid Category ID").optional(),
  country: z.string().trim().optional(),
  remoteOption: z.enum(jobRemoteOptions as [string, ...string[]]).optional(),
  employmentType: z.enum(jobEmploymentTypes as [string, ...string[]]).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});
