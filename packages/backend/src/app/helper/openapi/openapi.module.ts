import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { openapiController } from "./openapi.controller";

export const openapiModule = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
  app.register(openapiController, { prefix: "/v1/docs" });
};
