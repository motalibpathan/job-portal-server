require("dotenv").config();

import { createServer } from "http";
import createApp from "./app";
import { createCacheDBConnections } from "./cacheDB/connection";
import { createConnectionAndInitialize } from "./database/createConnection";
import config from "./settings/config";
import logger from "./util/winston";

const port = process.env.PORT || 5000;

process.on("unhandledRejection", (error) => {
  logger.error("Unhandled error", error);
});

const server = createServer(createApp());

server.listen(port, () => {
  logger.info(`Job Portal server is listening on ${port}`);

  // connect
  createConnectionAndInitialize(config.dbUrl)
    .then(() => {
      // cacheDb connections
      createCacheDBConnections();
    })
    .catch((err) => {
      logger.error(err);
      process.exit(1);
    });
});
