import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { appSecretController } from "./app-secret-controller";

export const appSecretModule = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
  app.register(appSecretController, { prefix: "/v1/app-secrets" });
};
