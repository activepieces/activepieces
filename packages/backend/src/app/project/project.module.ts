import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { projectController } from "./project.controller";

export const projectModule = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
    app.register(projectController, { prefix: "/v1/projects" });
};
