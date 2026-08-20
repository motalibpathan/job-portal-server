import { createClient } from "redis";
import config from "../settings/config";
import logger from "../util/winston";

export const redisClient = createClient({
  url: config.redisUrl,
});

export function createCacheDBConnections() {
  redisClient.on("error", (err) => {
    logger.error("Error connecting to redis");
    logger.error(err);
  });

  redisClient.connect().then(() => {
    logger.info("Redis DB connected");
  });
}
