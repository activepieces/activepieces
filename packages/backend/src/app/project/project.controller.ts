import { FastifyInstance } from 'fastify';
import { projectService } from './project.service';

export const projectController = async (fastify: FastifyInstance) => {
    fastify.get('/', async (request) => {
        return await projectService.getAll(request.principal.id);
    });
};
