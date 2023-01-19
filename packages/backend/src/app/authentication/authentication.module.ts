import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { authenticationController } from "./authentication.controller";

export const authenticationModule = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
  app.register(authenticationController, { prefix: "/v1/authentication" });
};
