import { ActivepiecesError, ErrorCode, UpdateProjectRequest } from '@activepieces/shared'
import { projectService } from './project.service'
import { FastifyPluginCallbackTypebox, Type } from '@fastify/type-provider-typebox'

export const projectController: FastifyPluginCallbackTypebox = (fastify, _opts, done) => {
    fastify.get('/', async (request) => {
        return await projectService.getAll(request.principal.id)
    })


    // We don't use the `projectId`, but we need it to differentiate between creating a new project and updating an existing one.
    fastify.post(
        '/:projectId',
        {
            schema: {
                body: UpdateProjectRequest,
                params: Type.Object({
                    projectId: Type.String(),
                }),
            },
        },
        async (request) => {
            if(request.params.projectId !== request.principal.projectId) {
                throw new ActivepiecesError({
                    code: ErrorCode.PROJECT_NOT_FOUND,
                    params: {
                        id: request.params.projectId,
                    },
                })
            }
            return await projectService.update(request.principal.projectId, request.body)
        },
    )

    done()
}
