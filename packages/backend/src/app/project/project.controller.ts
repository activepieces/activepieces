import { ActivepiecesError, ErrorCode, UpdateProjectRequest } from '@activepieces/shared'
import { FastifyInstance, FastifyRequest } from 'fastify'
import { projectService } from './project.service'

export const projectController = async (fastify: FastifyInstance) => {
    fastify.get('/', async (request) => {
        return await projectService.getAll(request.principal.id)
    })


    // We don't use the `projectId`, but we need it to differentiate between creating a new project and updating an existing one.
    fastify.post(
        '/:projectId',
        {
            schema: {
                body: UpdateProjectRequest,
            },
        },
        async (request: FastifyRequest<{ Body: UpdateProjectRequest, Params: {
            projectId: string
        } }>) => {
            if(request.params.projectId !== request.principal.projectId){
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
}
