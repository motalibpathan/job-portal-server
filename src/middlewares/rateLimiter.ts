import { Request } from "express";
import { Options, rateLimit } from "express-rate-limit";

// key generator needs to be passes, when "trust-proxy" is used
// see https://express-rate-limit.mintlify.app/reference/error-codes#err-erl-permissive-trust-proxy
const keyGenerator = (req: Request) => req.ip || "";

const getMillisecondsFromHours = (hours: number) => hours * 60 * 60 * 1000;
const getMillisecondsFromMinutes = (minutes: number) => minutes * 60 * 1000;
const getMillisecondsFromSeconds = (seconds: number) => seconds * 1000;

const commonLimiterOptions: Partial<Options> = {
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator, // generates key to track IP address
};

// limits to 40 calls every 2 hours
export const userAuthAPIsRateLimiter = rateLimit({
  windowMs: getMillisecondsFromHours(2),
  limit: 40,
  ...commonLimiterOptions,
});

// limits to 10 calls every 60 minutes
export const profileAuthAPIsRateLimiter = rateLimit({
  windowMs: getMillisecondsFromMinutes(60),
  limit: 10,
  ...commonLimiterOptions,
});

// limits to 60 calls every 1 minute
export const profileGeneralAPIsRateLimiter = rateLimit({
  windowMs: getMillisecondsFromMinutes(1),
  limit: 60,
  ...commonLimiterOptions,
});

// limits to 200 calls every 1 minute
export const orderingAPIsRateLimiter = rateLimit({
  windowMs: getMillisecondsFromMinutes(1),
  limit: 200,
  ...commonLimiterOptions,
});

// limits to 5 calls every 30 seconds
export const orderingOrderAPIsRateLimiter = rateLimit({
  windowMs: getMillisecondsFromSeconds(30),
  limit: 5,
  ...commonLimiterOptions,
});

// limits to 10 calls every 2 minutes
export const orderingOrderOpenAPIsRateLimiter = rateLimit({
  windowMs: getMillisecondsFromMinutes(2),
  limit: 10,
  ...commonLimiterOptions,
});

// limits to 20 calls every 5 minutes
export const orderingOrderDeleteAPIsRateLimiter = rateLimit({
  windowMs: getMillisecondsFromMinutes(5),
  limit: 20,
  ...commonLimiterOptions,
});

// limits to 20 calls every 5 minutes
export const orderingOrderOtpVerifyAPIsRateLimiter = rateLimit({
  windowMs: getMillisecondsFromMinutes(5),
  limit: 20,
  ...commonLimiterOptions,
});
