import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { usageService } from "./usage.service.ee";

export const usageModule = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
  app.register(usageController, { prefix: "/v1/usage" });
};

const usageController = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
  fastify.get(
    "/",
    async (
      request,
      _reply
    ) => {
      return await usageService.getUsage({projectId: request.principal.projectId});
    }
  );
};