import mongoose from "mongoose";
import * as yup from "yup";
import { z } from "zod";

class ObjectIdSchema extends yup.mixed {
  constructor() {
    super({ type: "objectId" });

    this.withMutation((schema) => {
      schema.transform(function (value) {
        if (this.isType(value)) return value;
        return schema.typeError;
      });
    });
  }

  _typeCheck(value: any) {
    return mongoose.isObjectIdOrHexString(value);
  }
}

export const mongoId = new ObjectIdSchema();

export const getZodMongoId = (message = "Id is invalid") =>
  z.string().refine((val) => mongoose.isObjectIdOrHexString(val), { message });

export const getZodMongoIdAndTransform = (message = "Id is invalid") =>
  z
    .string()
    .refine((val) => mongoose.isObjectIdOrHexString(val), { message })
    .transform((val) => new mongoose.Types.ObjectId(val));

export const emailRegExPattern: RegExp = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

// E.164 format, special case for Bangladesh 11 digit phone number
export const phoneNumberRegExPattern: RegExp =
  /^(?:\+88\d{11}|\+(?!88)[1-9]\d{7,14})$/;

// Contains only lowercase letters, digits or hyphens.
// Is between 3 and 48 characters long.
export const usernameRegexPart1 = /^[a-z0-9-]{3,48}$/;
export const usernameRegexPart1ErrorMessage =
  "Username can have small letters, numbers and -";

// Does not contain consecutive hyphens.
// Does not start or end with hyphen.
export const usernameRegexPart2 = /^(?!.*[-]{2})[^-].*[^-]$/;
export const usernameRegexPart2ErrorMessage =
  "Username cannot have - at start, end or consecutively";

export const storeIdValidatorField = {
  storeId: mongoId
    .typeError("Store Id is invalid")
    .required("Store Id is required"),
};

export const storeIdZodValidatorField = {
  storeId: getZodMongoId("Store Id is invalid"),
};

export const branchIdValidatorField = {
  branchId: mongoId
    .typeError("Branch Id is invalid")
    .required("Branch Id is required"),
};

export const branchIdZodValidatorField = {
  branchId: getZodMongoId("Branch Id is invalid"),
};

export const productIdValidatorField = {
  productId: mongoId
    .typeError("Product Id is invalid")
    .required("Product Id is required"),
};

export const productIdZodValidatorField = {
  productId: getZodMongoId("Product Id is invalid"),
};

export const orderIdZodValidatorField = {
  orderId: getZodMongoId("Order Id is invalid"),
};

export const storeIdValidator = yup.object().shape({
  ...storeIdValidatorField,
});

export const storeIdZodValidationSchema = z.object({
  ...storeIdZodValidatorField,
});

export const branchIdValidator = yup.object().shape({
  ...branchIdValidatorField,
});

export const branchIdZodValidationSchema = z.object({
  ...branchIdZodValidatorField,
});

export const storeIdAndBranchIdValidator = yup.object().shape({
  ...storeIdValidatorField,
  ...branchIdValidatorField,
});

export const storeIdAndBranchIdZodValidationSchema = z.object({
  ...storeIdZodValidatorField,
  ...branchIdZodValidatorField,
});

export const storeIdBranchIdAndOrderIdZodValidationSchema = z.object({
  ...storeIdZodValidatorField,
  ...branchIdZodValidatorField,
  ...orderIdZodValidatorField,
});

export const storeIdAndProductIdValidator = yup.object().shape({
  ...storeIdValidatorField,
  ...productIdValidatorField,
});

export const storeIdAndProductIdZodValidationSchema = z.object({
  ...storeIdZodValidatorField,
  ...productIdZodValidatorField,
});

export const storeIdBranchIdAndProductIdValidator = yup.object().shape({
  ...storeIdValidatorField,
  ...branchIdValidatorField,
  ...productIdValidatorField,
});

export const storeIdBranchIdAndProductIdZodValidationSchema = z.object({
  ...storeIdZodValidatorField,
  ...branchIdZodValidatorField,
  ...productIdZodValidatorField,
});

export const fetchValidatorField = yup
  .string()
  .oneOf(["true"], "Fetch value `true` should be passed");

export const fetchZodValidatorField = z.enum(["true"], {
  error: "Fetch value `true` should be passed",
});

export const branchIdsValidator = (data: {
  isAllBranches: boolean;
  branchIds?: string[];
}) => {
  if (!data.isAllBranches && !data.branchIds?.length) {
    return false;
  }
  return true;
};

export const servicesValidator = (data: {
  isAllServices: boolean;
  services?: string[];
}) => {
  if (!data.isAllServices && !data.services?.length) {
    return false;
  }
  return true;
};

export const channelsValidator = (data: {
  isAllChannels: boolean;
  channels?: string[];
}) => {
  if (!data.isAllChannels && !data.channels?.length) {
    return false;
  }
  return true;
};
