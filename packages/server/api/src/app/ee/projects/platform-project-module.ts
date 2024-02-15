import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { usersProjectController } from './platform-user-project-controller'
import { platformProjectController } from './platform-project-controller'
import { projectWorkerController } from '../../project/project-worker-controller'

export const platformProjectModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(platformProjectController, { prefix: '/v1/projects' })
    await app.register(usersProjectController, { prefix: '/v1/users/projects' })
    await app.register(projectWorkerController, { prefix: '/v1/worker/project' })
}
