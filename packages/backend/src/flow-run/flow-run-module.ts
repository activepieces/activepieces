import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { flowRunController as controller } from "./flow-run-controller";

export const flowRunModule = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
    app.register(controller, { prefix: "/v1/flow-runs" });
};
