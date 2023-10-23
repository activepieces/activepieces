import { ActivepiecesError, ErrorCode, UpdateProjectRequest } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, FastifyPluginCallbackTypebox, Type } from '@fastify/type-provider-typebox'
import { enterpriseProjectService } from './enterprise-project-service'
import { projectService } from '../../project/project-service'
import { tokenUtils } from '../../authentication/lib/token-utils'

export const enterpriseProjectModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(enterpriseProjectController, { prefix: '/v1/projects' })
}

const enterpriseProjectController: FastifyPluginCallbackTypebox = (fastify, _opts, done) => {
    fastify.get('/', async (request) => {
        return await enterpriseProjectService.getAll({
            ownerId: request.principal.id,
        })
    })

    fastify.post(
        '/:projectId/token',
        {
            schema: {
                params: Type.Object({
                    projectId: Type.String(),
                }),
            },
        },
        async (request) => {
            const allProjects = await enterpriseProjectService.getAll({
                ownerId: request.principal.id,
            })
            const project = allProjects.find((project) => project.id === request.params.projectId)
            if (!project) {
                throw new ActivepiecesError({
                    code: ErrorCode.PROJECT_NOT_FOUND,
                    params: {
                        id: request.params.projectId,
                    },
                })
            }
            return {
                token: await tokenUtils.encode({
                    id: request.principal.id,
                    type: request.principal.type,
                    projectId: request.params.projectId,
                    projectType: project.type,
                    projectPlatformId: project.platformId,
                }),
            }
        },
    )


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
            if (request.params.projectId !== request.principal.projectId) {
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
