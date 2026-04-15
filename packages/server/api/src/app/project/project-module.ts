import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { projectController } from './project-controller'
import { projectWorkerController } from './project-worker-controller'

export const projectModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(projectController, { prefix: '/v1/projects' })
    await app.register(projectWorkerController, { prefix: '/v1/worker/project' })
}
