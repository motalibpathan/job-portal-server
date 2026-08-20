import { sanitizeUrl } from "../util/helpers";

// deploy
const DEPLOY: "development" | "production" =
  process.env.DEPLOY === "development" ? "development" : "production";

const LOG_DEPLOY: "console" | "cloud" | "all" =
  process.env.LOG_DEPLOY === "all"
    ? "all"
    : process.env.LOG_DEPLOY === "cloud"
    ? "cloud"
    : "console";

// db URL
const dbUrl = process.env.DB_URL || "";
const redisUrl = process.env.REDIS_URL || "";

// secrets
const CLIENT_SECRET = process.env.CLIENT_SECRET || "client_secret";
const CLIENT_ACCESS_TOKEN_EXPIRATION_TIME_SECOND = parseInt(
  process.env.CLIENT_ACCESS_TOKEN_EXPIRATION_TIME_SECOND || "2400",
  10,
);
const CLIENT_REFRESH_TOKEN_EXPIRATION_TIME_SECOND = parseInt(
  process.env.CLIENT_REFRESH_TOKEN_EXPIRATION_TIME_SECOND || "2400",
  10,
);

const ADMIN_SECRET = process.env.ADMIN_SECRET || "admin_secret";
const ADMIN_ACCESS_TOKEN_EXPIRATION_TIME_SECOND = parseInt(
  process.env.ADMIN_ACCESS_TOKEN_EXPIRATION_TIME_SECOND || "2400",
  10,
);
const ADMIN_REFRESH_TOKEN_EXPIRATION_TIME_SECOND = parseInt(
  process.env.ADMIN_REFRESH_TOKEN_EXPIRATION_TIME_SECOND || "2400",
  10,
);

// site URL
const SITE_URL = sanitizeUrl(process.env.SITE_URL || "http://localhost:3000");
const ADMIN_DASHBOARD_URL = sanitizeUrl(
  process.env.ADMIN_DASHBOARD_URL || "http://localhost:3001",
);
const ORDERS_DASHBOARD_URL = sanitizeUrl(
  process.env.ORDERS_DASHBOARD_URL || "http://localhost:3002",
);

// aws
const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY || "";
const AWS_ACCESS_KEY_SECRET = process.env.AWS_ACCESS_KEY_SECRET || "";
const AWS_ACCESS_REGION = process.env.AWS_ACCESS_REGION || "ap-south1";

// s3
const S3_BUCKET = process.env.S3_BUCKET || "";

const CLOUDWATCH_LOG_STREAM = process.env.CLOUDWATCH_LOG_STREAM;

// google oauth
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";

// emails
const EMAIL_MAIN = process.env.EMAIL_MAIN || "";
const EMAIL_NO_REPLY = process.env.EMAIL_NO_REPLY || "";

export default {
  DEPLOY,
  LOG_DEPLOY,

  dbUrl,
  redisUrl,

  ADMIN_SECRET,
  CLIENT_SECRET,
  CLIENT_ACCESS_TOKEN_EXPIRATION_TIME_SECOND,
  CLIENT_REFRESH_TOKEN_EXPIRATION_TIME_SECOND,
  ADMIN_ACCESS_TOKEN_EXPIRATION_TIME_SECOND,
  ADMIN_REFRESH_TOKEN_EXPIRATION_TIME_SECOND,

  SITE_URL,
  ADMIN_DASHBOARD_URL,
  ORDERS_DASHBOARD_URL,

  AWS_ACCESS_KEY,
  AWS_ACCESS_KEY_SECRET,
  AWS_ACCESS_REGION,

  S3_BUCKET,

  CLOUDWATCH_LOG_STREAM,

  GOOGLE_CLIENT_ID,

  EMAIL_MAIN,
  EMAIL_NO_REPLY,
};
