// OTP types
export const OTP_TYPES = {
  PROFILE_LOGIN: "profile_login" as const,
  PROFILE_RESET: "profile_reset" as const,
  PROFILE_UPDATE: "profile_update" as const,
  USER_SIGNUP: "user_signup" as const,
  USER_LOGIN: "user_login" as const,
  USER_RESET: "user_reset" as const,
  USER_UPDATE: "user_update" as const,
  ORDER_PROFILE: "order_profile" as const,
};

export const otpTypes = Object.values(OTP_TYPES);
export type TOtpTypes = (typeof otpTypes)[number];

export const SMS_PROVIDERS = {
  default: "default" as const,
};

export const smsProviders = Object.values(SMS_PROVIDERS);
export type TSmsProvider = (typeof smsProviders)[number];

export const SMS_USE_CASES = {
  OTP: "otp" as const,
  ORDER: "order" as const,
  CAMPAIGN: "campaign" as const,
};

export const smsUseCases = Object.values(SMS_USE_CASES);
export type TSmsUseCase = (typeof smsUseCases)[number];

export const SMS_SEND_INSTANCES = {
  ORDER_CREATED: "order_created" as const,
  ORDER_PAYMENT: "order_payment" as const,
  ORDER_COMPLETION: "order_completion" as const,
};

export const smsSendInstances = Object.values(SMS_SEND_INSTANCES);
export type TSmsSendInstance = (typeof smsSendInstances)[number];

// STORE REFERENCE TYPES
export const SMS_CAMPAIGN_STATUS = {
  PENDING: "pending" as const,
  SCHEDULED: "scheduled" as const,
  COMPLETED: "completed" as const,
  CANCELLED: "cancelled" as const,
};

export const smsCampaignTypes = Object.values(SMS_CAMPAIGN_STATUS);
export type TSmsCampaignType = (typeof smsCampaignTypes)[number];
