import {FastifyInstance, FastifyPluginOptions, FastifyRequest} from "fastify"
import {projectService} from "./project.service";

export const projectController = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
    fastify.get('/', async (request, _reply) => {
        return projectService.getAll(request.principal.id);
    })
};
