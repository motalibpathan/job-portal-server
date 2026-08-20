import * as yup from "yup";
import { phoneNumberRegExPattern } from "../commonValidator";

export const googleLoginValidator = yup.object().shape({
  token: yup.string().required("Token is required"),
  email: yup.string().required("Email is required").email("Invalid email"),
  name: yup.string(),
  profilePicture: yup.string(),
});

export const facebookLoginValidator = yup.object().shape({
  token: yup.string().required("Token is required"),
});

// phone numbers
export const phoneNumberSignupCheckValidator = yup.object().shape({
  phoneNumber: yup
    .string()
    .required("phone number is required")
    .matches(phoneNumberRegExPattern, "Phone number is not valid"),
  recaptchaToken: yup.string().required("Verification token is required"),
});

export const phoneNumberSignupValidator = yup.object().shape({
  name: yup.string().required("Name is required").min(3, "Name is too small"),
  phoneNumber: yup
    .string()
    .required("phone number is required")
    .matches(phoneNumberRegExPattern, "Phone number is not valid"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters long"),
  otp: yup.string().required("OTP is required").min(4, "OTP is not valid"),
  idToken: yup.string(),
});

export const phoneNumberLoginCheckValidator = yup.object().shape({
  recaptchaToken: yup.string().required("Verification token is required"),
  phoneNumber: yup
    .string()
    .required("phone number is required")
    .matches(phoneNumberRegExPattern, "Phone number is not valid"),
});

export const phoneNumberOtpValidator = yup.object().shape({
  phoneNumber: yup
    .string()
    .required("phoneNumber is required")
    .matches(phoneNumberRegExPattern, "Phone number is not valid"),
  otp: yup.string().required("OTP is required").min(4, "OTP is not valid"),
});

export const phoneNumberLoginValidator = yup.object().shape({
  phoneNumber: yup
    .string()
    .required("phone number is required")
    .matches(phoneNumberRegExPattern, "Phone number  is not valid"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters long"),
  idToken: yup.string(),
  otp: yup.string(),
});

export const phoneNumberPasswordResetValidator = yup.object().shape({
  phoneNumber: yup
    .string()
    .required("phone number is required")
    .matches(phoneNumberRegExPattern, "Phone number  is not valid"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters long"),
  idToken: yup.string(),
  otp: yup.string().when("idToken", {
    is: undefined,
    then: yup.string().required("OTP or IdToken is required"),
  }),
});

export const phoneNumberUpdateValidator = yup.object().shape({
  phoneNumber: yup
    .string()
    .required("phone number is required")
    .matches(phoneNumberRegExPattern, "Phone number  is not valid"),
  idToken: yup.string(),
  otp: yup.string().when("idToken", {
    is: undefined,
    then: yup.string().required("OTP or IdToken is required"),
  }),
});

export const phoneNumberCheckValidator = yup.object().shape({
  recaptchaToken: yup.string().required("Verification token is required"),
  phoneNumber: yup
    .string()
    .required("phone number is required")
    .matches(phoneNumberRegExPattern, "Phone number  is not valid"),
});

// emails
export const emailSignupCheckValidator = yup.object().shape({
  recaptchaToken: yup.string().required("Verification token is required"),
  email: yup
    .string()
    .email("Email is not valid")
    .required("email is required")
    .lowercase(),
});

export const emailSignupValidator = yup.object().shape({
  name: yup.string().required("Name is required").min(3, "Name is too small"),
  email: yup.string().email("Email is not valid").required("email is required"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters long"),
  otp: yup.string().min(4, "OTP is not valid"),
});

export const emailSignupWithoutOtpValidator = yup.object().shape({
  name: yup.string().required("Name is required").min(3, "Name is too small"),
  email: yup.string().email("Email is not valid").required("email is required"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters long"),
});

export const emailLoginCheckValidator = yup.object().shape({
  recaptchaToken: yup.string(),
  email: yup
    .string()
    .email("Email is not valid")
    .required("email is required")
    .lowercase(),
});

export const emailOtpValidator = yup.object().shape({
  email: yup
    .string()
    .email("Email is not valid")
    .required("email is required")
    .lowercase(),
  otp: yup.string().required("OTP is required").min(4, "OTP is not valid"),
});

export const emailLoginValidator = yup.object().shape({
  email: yup.string().email("Email is not valid").required("email is required"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters long"),
  otp: yup.string(),
});

export const emailResetValidator = yup.object().shape({
  recaptchaToken: yup.string().required("Verification token is required"),
  email: yup.string().email("Email is not valid").required("email is required"),
});

export const emailPasswordResetValidator = yup.object().shape({
  email: yup.string().email("Email is not valid").required("email is required"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters long"),
  otp: yup.string().required("OTP is required"),
});

export const emailUpdateValidator = yup.object().shape({
  recaptchaToken: yup.string().required("Verification token is required"),
  email: yup.string().email("Email is not valid").required("email is required"),
});

export const emailUpdateOtpValidator = yup.object().shape({
  email: yup
    .string()
    .email("Email is not valid")
    .required("email is required")
    .lowercase(),
  otp: yup.string().required("OTP is required").min(4, "OTP is not valid"),
});

export const userNameValidator = yup.object().shape({
  name: yup.string().required("Name is required"),
});

export const companyUserNameValidator = yup
  .string()
  .matches(
    /^[a-z0-9-]+$/,
    "Company username can only contain lowercase letters, numbers and hyphens",
  )
  .min(3, "Company username is too small")
  .max(30, "Company username is too long");

export const signupWithCompanyValidator = yup.object().shape({
  name: yup.string().required("Name is required").min(3, "Name is too small"),
  email: yup.string().email("Email is not valid").required("email is required").lowercase(),
  companyName: yup.string().required("Company name is required").min(2, "Company name is too small"),
  companyUserName: companyUserNameValidator,
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters long"),
});
