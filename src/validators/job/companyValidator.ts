import { z } from "zod";

const companyUrlField = z
  .string()
  .trim()
  .refine((value) => !value || /^https?:\/\/.+/.test(value), {
    message: "Invalid URL",
  });

export const companyUserNameSchema = z
  .string()
  .trim()
  .regex(
    /^[a-z0-9-]+$/,
    "Company username can only contain lowercase letters, numbers and hyphens",
  )
  .min(3, "Company username is too small")
  .max(30, "Company username is too long");

export const createCompanyBodySchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  userName: companyUserNameSchema.optional(),
  description: z.string().trim().optional(),
  websiteUrl: companyUrlField.optional(),
  logoUrl: companyUrlField.optional(),
});

export const companyUsernameQuerySchema = z.object({
  username: companyUserNameSchema,
});

export const updateCompanyBodySchema = createCompanyBodySchema.partial();

export const joinTeamBodySchema = z.object({
  token: z.string().min(1),
});
