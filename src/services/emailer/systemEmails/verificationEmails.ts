import { sendTemplatedEmail } from "../ses";
import { BASIC_TEMPLATE_DATA, REGULAR_TEMPLATES } from "../utils";

export const sendSignupVerificationOTPEmail = async (
  emailTo: string,
  otp: string,
) => {
  const emailInfo = await sendTemplatedEmail(
    "main",
    [emailTo],
    REGULAR_TEMPLATES.verification_code,
    {
      ...BASIC_TEMPLATE_DATA(),
      verification_code: otp,
    },
  );
  return emailInfo;
};

export const sendLoginVerificationOTPEmail = async (
  emailTo: string,
  otp: string,
) => {
  const emailInfo = await sendTemplatedEmail(
    "main",
    [emailTo],
    REGULAR_TEMPLATES.verification_code,
    {
      ...BASIC_TEMPLATE_DATA(),
      verification_code: otp,
    },
  );
  return emailInfo;
};

export const sendResetVerificationOTPEmail = async (
  emailTo: string,
  otp: string,
) => {
  const emailInfo = await sendTemplatedEmail(
    "main",
    [emailTo],
    REGULAR_TEMPLATES.verification_code,
    {
      ...BASIC_TEMPLATE_DATA(),
      verification_code: otp,
    },
  );
  return emailInfo;
};

export const sendUpdateVerificationOTPEmail = async (
  emailTo: string,
  otp: string,
) => {
  const emailInfo = await sendTemplatedEmail(
    "main",
    [emailTo],
    REGULAR_TEMPLATES.verification_code,
    {
      ...BASIC_TEMPLATE_DATA(),
      verification_code: otp,
    },
  );

  return emailInfo;
};
