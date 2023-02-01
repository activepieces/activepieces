import { FastifyPluginAsync } from "fastify";
import { databaseConnection } from "./database-connection";

export const databaseModule: FastifyPluginAsync = async (_app, _opts) => {
  await databaseConnection.initialize();
};
