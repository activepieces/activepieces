import { FastifyPluginAsync } from "fastify";
import { flowRunController as controller } from "./flow-run-controller";

export const flowRunModule: FastifyPluginAsync = async (app, _opts) => {
    await app.register(controller, { prefix: "/v1/flow-runs" });
};
