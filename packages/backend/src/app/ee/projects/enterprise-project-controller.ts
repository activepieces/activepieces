import { ActivepiecesError, ErrorCode, ProjectType, assertNotNullOrUndefined } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, FastifyPluginCallbackTypebox, Type } from '@fastify/type-provider-typebox'
import { enterpriseProjectService } from './enterprise-project-service'
import { projectService } from '../../project/project-service'
import { tokenUtils } from '../../authentication/lib/token-utils'
import { CreateProjectRequest, UpdateProjectRequest } from '@activepieces/ee-shared'

export const enterpriseProjectModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(enterpriseProjectController, { prefix: '/v1/projects' })
}

const enterpriseProjectController: FastifyPluginCallbackTypebox = (fastify, _opts, done) => {

    fastify.post(
        '/',
        {
            schema: {
                body: CreateProjectRequest,
            },
        },
        async (request) => {
            const platformId = request.principal.platformId
            assertNotNullOrUndefined(platformId, 'platformId')
            return await projectService.create({
                ownerId: request.principal.id,
                displayName: request.body.displayName,
                platformId,
                type: ProjectType.PLATFORM_MANAGED,
            })
        },
    )

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
                    platformId: request.principal.platformId,
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
          
            return await projectService.update({
                platformId: request.principal.platformId,
                projectId: request.principal.projectId,
                request: request.body,
            })
            
        },
    )

    done()
}
