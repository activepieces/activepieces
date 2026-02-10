import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { projectWorkerController } from '../../project/project-worker-controller'
import { platformProjectController } from './platform-project-controller'
import { usersProjectController } from './platform-user-project-controller'

export const platformProjectModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(platformProjectController, { prefix: '/v1/projects' })
    await app.register(usersProjectController, { prefix: '/v1/users/projects' })
    await app.register(projectWorkerController, { prefix: '/v1/worker/project' })
}
