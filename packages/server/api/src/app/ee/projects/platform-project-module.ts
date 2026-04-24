import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { projectWorkerController } from '../../project/project-worker-controller'
import { platformListController } from '../platform/platform-list-controller'
import { platformProjectController } from './platform-project-controller'

export const platformProjectModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(platformProjectController, { prefix: '/v1/projects' })
    await app.register(platformListController, { prefix: '/v1/platforms' })
    await app.register(projectWorkerController, { prefix: '/v1/worker/project' })
}
