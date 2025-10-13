import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { SystemJobData, SystemJobName } from '../../helper/system-jobs/common'
import { systemJobHandlers } from '../../helper/system-jobs/job-handlers'
import { projectWorkerController } from '../../project/project-worker-controller'
import { platformProjectController } from './platform-project-controller'
import { platformProjectService } from './platform-project-service'
import { usersProjectController } from './platform-user-project-controller'

export const platformProjectModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(platformProjectController, { prefix: '/v1/projects' })
    await app.register(usersProjectController, { prefix: '/v1/users/projects' })
    await app.register(projectWorkerController, { prefix: '/v1/worker/project' })
}
