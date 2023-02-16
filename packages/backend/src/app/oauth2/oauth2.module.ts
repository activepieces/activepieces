import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { oauth2Controller } from "./oauth2.controller";

export const oauth2Module = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
    app.register(oauth2Controller, { prefix: "/v1/oauth2" });
};
