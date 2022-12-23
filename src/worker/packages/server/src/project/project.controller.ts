import {FastifyInstance, FastifyPluginOptions, FastifyRequest} from "fastify"
import {projectService} from "./project.service";

export const projectController = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
    fastify.get('/', async (_request, _reply) => {
        return projectService.getAll(_request.user.id);
    })

};

