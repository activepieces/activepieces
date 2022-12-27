import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { instanceRunController as controller } from "./instance-run-controller";

export const instanceRunModule = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
    app.register(controller);
};
