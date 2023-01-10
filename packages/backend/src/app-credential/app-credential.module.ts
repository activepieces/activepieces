import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { appCredentialController } from "./app-credential-controller";

export const appCredentialModule = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
  app.register(appCredentialController, { prefix: "/v1/app-credentials" });
};
