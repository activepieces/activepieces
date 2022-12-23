import { ProjectDTO } from 'shared/src/dto/projects/project-request';
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { projectService } from '../project/project.services';

export const projectController = async (
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) => {
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = request.params.id;
    const project = await projectService.getProjectById(id);
    reply.send(project);
  });

  fastify.get('/', async (_request, reply) => {
    const projects = await projectService.listProjects();
    reply.send(projects);
  });
};
