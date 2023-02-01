import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { appConnectionController } from "./app-connection.controller";

export const appConnectionModule = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
  app.register(appConnectionController, { prefix: "/v1/app-connections" });
};
