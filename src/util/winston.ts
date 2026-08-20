import moment from "moment";
import { createLogger, format, transports } from "winston";
import WinstonCloudWatch from "winston-cloudwatch";
import config from "../settings/config";

const { prettyPrint } = format;

// cloudwatch transport
const cloudWatchTransport = new WinstonCloudWatch({
  logGroupName: `job-portal-server-${config.DEPLOY}-${
    config.CLOUDWATCH_LOG_STREAM || "v3"
  }`,
  logStreamName: function () {
    return `${moment().format("MMM D, YYYY")}-v4`;
  },
  retentionInDays: 30,
  jsonMessage: true,
  level: "debug",
  awsOptions: {
    credentials: {
      accessKeyId: config.AWS_ACCESS_KEY,
      secretAccessKey: config.AWS_ACCESS_KEY_SECRET,
    },
    region: config.AWS_ACCESS_REGION,
  },
});
// console transport
const consoleTransport = new transports.Console();

// process transports
let logTransports: any[] = [cloudWatchTransport];
if (config.LOG_DEPLOY === "console") {
  logTransports = [consoleTransport];
}
if (config.LOG_DEPLOY === "all") {
  logTransports = [cloudWatchTransport, consoleTransport];
}

const logger = createLogger({
  level: "debug",
  format: format.combine(format.json(), prettyPrint()),
  transports: logTransports,
  exitOnError: false,
  handleExceptions: true,
});

export default logger;
