import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { databaseConnection } from "./database-connection";
import { redisLockClient } from "./redis-connection";

export const databaseModule = async (_app: FastifyInstance, _options: FastifyPluginOptions) => {
  await databaseConnection.initialize();
  await redisLockClient.connect();
};
