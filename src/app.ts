import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";

require("dotenv").config();
require("express-async-errors");
require("./types/express.custom");

import "./cacheDB/connection";
import errorHandler from "./middlewares/errorHandler";

import { registerAppRoutes } from "./appRoutes";

import logger from "./util/winston";

function createApp() {
  const app = express();

  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json({ limit: "200mb" }));

  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );

  // required to properly log and track IP addresses
  app.enable("trust proxy");

  const HEALTH_URL = "/health";

  const originalSend = app.response.send;
  (app as any).response.send = function sendOverWrite(body) {
    originalSend.call(this, body);
    this.responseBody = body;
  };

  morgan.token("body", (req: any) => req.body);
  morgan.token("res-body", (_req, res: any) => res.responseBody);

  app.use(
    morgan(function (tokens, req, res) {
      try {
        if (process.env.NODE_ENV === "test") return;

        const method = tokens.method(req, res);
        const url = tokens.url(req, res);
        const statusCode = res.statusCode;
        const responseTime = parseInt(tokens["response-time"](req, res) || "");
        const remoteAddress = tokens["remote-addr"](req, res);
        const referrer = tokens["referrer"](req, res);
        const userAgent = tokens["user-agent"](req, res);
        const requestBody = tokens.body(req, res);
        const responseBody = tokens["res-body"](req, res);

        if (
          !statusCode ||
          !responseTime ||
          isNaN(responseTime) ||
          method === "OPTIONS" ||
          statusCode === 304
        )
          return;

        if (url === HEALTH_URL) return;

        const log: any = {
          method,
          url,
          statusCode,
          responseTime,
        };

        if (userAgent) log.userAgent = userAgent;
        if (remoteAddress) log.remoteAddress = remoteAddress;
        if (referrer) log.referrer = referrer;

        if ([400, 500].includes(statusCode)) {
          // log request body and response body for faulty responses
          if (
            req.headers["content-type"] &&
            req.headers["content-type"].includes("application/json") &&
            !req.file &&
            !req.files
          )
            log.requestBody = requestBody;

          log.responseBody = responseBody;
        }
        logger.http(log);
        return undefined;
      } catch {}
    }),
  );

  // routes
  registerAppRoutes(app);

  app.get("/ping", (req, res) => {
    return res.status(200).json({ message: "PING PONG" });
  });

  // used by load balancers and service checkers
  app.get(HEALTH_URL, (req, res) => {
    return res.status(200).json({ status: "health ok" });
  });

  app.use(errorHandler);

  return app;
}

export default createApp;
