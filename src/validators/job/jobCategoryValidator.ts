import { z } from "zod";
import { getZodMongoId } from "../commonValidator";

export const createJobCategoryBodySchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  companyId: getZodMongoId("Invalid Company ID"),
});

export const updateJobCategoryBodySchema = z.object({
  name: z.string().min(1, "Name is required").trim().optional(),
});

export const jobCategoryIdParamSchema = z.object({
  categoryId: getZodMongoId("Invalid Category ID"),
});

export const jobCategoryCompanyParamSchema = z.object({
  companyIdOrUsername: z.string().min(1, "Company ID or username is required"),
});
