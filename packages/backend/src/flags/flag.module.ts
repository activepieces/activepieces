import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { flagController } from "./flag.controller";

export const flagModule = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
  app.register(flagController, { prefix: "/v1/flags" });
};
