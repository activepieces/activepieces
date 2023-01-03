import { FastifyPluginAsync } from "fastify";
import { databaseConnection } from "./database-connection";
import { redisLockClient } from "./redis-connection";

export const databaseModule: FastifyPluginAsync = async (_app, _opts) => {
  await databaseConnection.initialize();
  await redisLockClient.connect();
};
