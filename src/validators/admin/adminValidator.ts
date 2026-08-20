import * as yup from "yup";
import { mongoId } from "../commonValidator";

export const signupUsername = yup.object().shape({
  name: yup.string().required(),
  username: yup.string().required(),
  phone: yup.string().required(),
  email: yup.string().required().email("Invalid email"),
  password: yup
    .string()
    .required()
    .min(8, "Password must be at least 8 characters"),
  level: yup
    .number()
    .required("Admin level is required")
    .min(1, "Admin level is not valid")
    .max(2, "Admin level is not valid"),
});

export const loginUsername = yup.object().shape({
  username: yup.string().required(),
  password: yup
    .string()
    .required()
    .min(6, "Password must be at least 6 characters"),
});

export const changePassword = yup.object().shape({
  oldPassword: yup.string().required(),
  newPassword: yup
    .string()
    .required()
    .min(8, "Password must be at least 8 characters"),
});

export const changePasswordSuperAdmin = yup.object().shape({
  adminId: mongoId.required(),
  password: yup
    .string()
    .required()
    .min(8, "Password must be at least 8 characters"),
});

export const verifyAdmin = yup.object().shape({
  adminId: mongoId.required(),
});
