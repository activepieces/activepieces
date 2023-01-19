import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { flowController } from "./flow.controller";

export const flowModule = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
  app.register(flowController, { prefix: "/v1/flows" });
};
