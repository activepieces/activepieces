import { ActivepiecesError, ErrorCode, ProjectType, assertNotNullOrUndefined, isNil } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, FastifyPluginCallbackTypebox, Type } from '@fastify/type-provider-typebox'
import { enterpriseProjectService } from './enterprise-project-service'
import { projectService } from '../../project/project-service'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
import { CreateProjectRequest, DEFAULT_PLATFORM_PLAN, UpdateProjectRequest } from '@activepieces/ee-shared'
import { platformService } from '../platform/platform.service'
import { plansService } from '../billing/project-plan//project-plan.service'

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
            const platformId = request.principal.platform?.id
            assertNotNullOrUndefined(platformId, 'platformId')
            const project = await projectService.create({
                ownerId: request.principal.id,
                displayName: request.body.displayName,
                platformId,
                type: ProjectType.PLATFORM_MANAGED,
            })
            await plansService.update({
                projectId: project.id,
                subscription: null,
                planLimits: DEFAULT_PLATFORM_PLAN,
            })
            return project
        },
    )

    fastify.get('/', {
        schema: {
            params: Type.Object({
                platformId: Type.Optional(Type.String()),
            }),
        },
    }, async (request) => {
        return await enterpriseProjectService.getAll({
            ownerId: request.principal.id,
            platformId: request.params.platformId,
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
            const platform = isNil(project.platformId) ? null : await platformService.getOne(project.platformId)
            return {
                token: await accessTokenManager.generateToken({
                    id: request.principal.id,
                    type: request.principal.type,
                    projectId: request.params.projectId,
                    projectType: project.type,
                    platform: isNil(platform) ? undefined : {
                        id: platform.id,
                        role: platform.ownerId === request.principal.id ? 'OWNER' : 'MEMBER',
                    },
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
                platformId: request.principal.platform?.id,
                projectId: request.principal.projectId,
                request: request.body,
            })

        },
    )

    done()
}
