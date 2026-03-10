import { securityAccess } from '@activepieces/server-common'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { projectService } from './project-service'

export const projectWorkerController: FastifyPluginAsyncZod = async (
    app,
) => {
    app.get('/', GetWorkerProjectRequest, async (req) => {
        const projectId = req.principal.projectId
        return projectService(req.log).getOneOrThrow(projectId)
    })
}

const GetWorkerProjectRequest = {
    config: {
        security: securityAccess.engine(),
    },
}
