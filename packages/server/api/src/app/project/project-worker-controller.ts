import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
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
