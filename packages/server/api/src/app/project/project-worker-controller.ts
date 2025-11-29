import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { projectService } from './project-service'
import { AuthorizationType, RouteKind } from '@activepieces/server-shared'

export const projectWorkerController: FastifyPluginAsyncTypebox = async (
    app,
) => {
    app.get('/', GetWorkerProjectRequest, async (req) => {
        const projectId = req.principal.projectId
        return projectService.getOneOrThrow(projectId)
    })
}

const GetWorkerProjectRequest = {
    config: {
        security: {
            kind: RouteKind.AUTHENTICATED,
            authorization: {
                type: AuthorizationType.ENGINE,
            },
        } as const,
    },
}
