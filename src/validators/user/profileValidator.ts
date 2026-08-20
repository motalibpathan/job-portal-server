import { z } from "zod";
import { addressTitles } from "../../constants/storeEnums";
import {
  fetchZodValidatorField,
  getZodMongoId,
  phoneNumberRegExPattern,
  storeIdZodValidatorField,
} from "../commonValidator";

export const profileLoginValidationSchema = z.object({
  phoneNumber: z
    .string()
    .regex(phoneNumberRegExPattern, "Please provide a valid phone number"),
  name: z
    .string()
    .min(3, "Profile name must be minimum 3 characters")
    .max(48, "Profile name must be less than 48 characters")
    .optional(),
  otp: z.string(),
});

export const profilePhoneNumberValidationSchema = z.object({
  phoneNumber: z
    .string("Please provide a valid phone number")
    .regex(phoneNumberRegExPattern, "Please provide a valid phone number"),
});

export const profilePhoneNumberChangeValidationSchema = z.object({
  phoneNumber: z
    .string()
    .regex(phoneNumberRegExPattern, "Please provide a valid phone number"),
  otp: z.string(),
});

export const profileNameChangeValidationSchema = z.object({
  name: z
    .string()
    .min(3, "Profile name must be minimum 3 characters")
    .max(48, "Profile name must be less than 48 characters"),
});

export const profileEmailChangeValidationSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
});

export const profileQueryParamValidationSchema = z.object({
  fetchRewardPoints: fetchZodValidatorField.optional(),
});

export const profileLookupQueryValidationSchema = z.object({
  phoneNumber: z.string().optional(),
  fetchAddresses: fetchZodValidatorField.optional(),
  fetchRewardPoints: fetchZodValidatorField.optional(),
});

export const profileIdPhoneLookupQueryValidationSchema = z.object({
  profileId: getZodMongoId("Profile Id is invalid").optional(),
  phoneNumber: z.string().optional(),
  fetchRewardPoints: fetchZodValidatorField.optional(),
});

export const storeIdAndAddressIdValidationSchema = z.object({
  ...storeIdZodValidatorField,
  addressId: getZodMongoId("Address Id is invalid"),
});

// Simplified address validator for Zod (complex nested validation kept in Yup for now)
const addressAreaValidationSchema = z.object({
  areaId: getZodMongoId("Area Id is invalid"),
  areaName: z.string(),
  areaType: z.string(),
});

const locationValidationSchema = z.object({
  type: z.literal("Point"),
  coordinates: z.array(z.number()).length(2),
});

export const profileAddressValidationSchema = z.object({
  title: z.enum(addressTitles as [string, ...string[]]),
  othersTag: z.string().optional(),
  mapAddress: z.string().optional(),
  mapDescription: z.string().optional(),
  location: locationValidationSchema.optional(),
  areaMain: addressAreaValidationSchema.optional(),
  areaTree: z.array(addressAreaValidationSchema).optional(),
  details: z.string().optional(),
});

// Zod validators for profile lists queries
export const storeProfilesListsQueryValidationSchema = z.object({
  search: z.string().optional(),
  branchIds: z.string().optional(),
  minimumNumberOfOrders: z.string().optional(),
  orderingDateFrom: z.string().optional(),
  orderingDateTo: z.string().optional(),
  pageNumber: z.string().optional(),
  pageSize: z.string().optional(),
  fetchRewardPoints: fetchZodValidatorField.optional(),
  isWithPhoneNumber: fetchZodValidatorField.optional(),
  channelTypes: z.string().optional(),
});

export const allProfilesListsQueryValidationSchema = z.object({
  ...storeProfilesListsQueryValidationSchema.shape,
  storeId: getZodMongoId("Store Id is invalid").optional(),
});

// Zod validator for storeId and profileId params
export const storeIdAndProfileIdValidationSchema = z.object({
  ...storeIdZodValidatorField,
  profileId: getZodMongoId("Profile Id is invalid"),
});

export const changePasswordValidator = z.object({
  oldPassword: z.string(),
  newPassword: z
    .string()
    .trim()
    .min(8, "Password must be at least 8 characters"),
});

export const facebookTokenQueryValidationSchema = z.object({
  token: z.string("Facebook token is required"),
});
