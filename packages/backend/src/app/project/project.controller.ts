import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { projectService } from "./project.service";

export const projectController = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
    fastify.get("/", async (request, _reply) => {
        return await projectService.getAll(request.principal.id);
    });
};
