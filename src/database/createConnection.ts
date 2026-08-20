import mongoose from "mongoose";
import logger from "../util/winston";

export function createConnectionAndInitialize(dbUrl: string): Promise<null> {
  // avoid test env
  if (process.env.NODE_ENV === "test") return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    mongoose.Promise = require("bluebird");
    mongoose
      .connect(dbUrl)
      .then(() => {
        logger.info("DB connected");
        resolve(null);
      })
      .catch((err) => {
        logger.error("DB not connected ", err);
        reject(err);
      });
  });
}
