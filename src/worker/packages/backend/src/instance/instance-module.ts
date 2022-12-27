import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { instanceController } from "./instance-controller";

export const instanceModule = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
    app.register(instanceController);
};
