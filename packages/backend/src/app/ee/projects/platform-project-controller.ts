import { ActivepiecesError, ErrorCode, Project, ProjectType, SeekPage, assertNotNullOrUndefined, isNil } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, FastifyPluginCallbackTypebox, Type } from '@fastify/type-provider-typebox'
import { platformProjectService } from './platform-project-service'
import { projectService } from '../../project/project-service'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
import { CreatePlatformProjectRequest, DEFAULT_PLATFORM_PLAN, UpdateProjectPlatformRequest } from '@activepieces/ee-shared'
import { platformService } from '../platform/platform.service'
import { plansService } from '../billing/project-plan/project-plan.service'
import { StatusCodes } from 'http-status-codes'

export const platformProjectModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(platformProjectController, { prefix: '/v1/projects' })
}

const platformProjectController: FastifyPluginCallbackTypebox = (fastify, _opts, done) => {

    fastify.post( '/', CreateProjectRequest, async (request, reply) => {
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
        await reply.status(StatusCodes.CREATED).send(project)
    },
    )

    fastify.get('/', ListProjectRequest, async (request) => {
        return platformProjectService.getAll({
            ownerId: request.principal.id,
            platformId: request.query.platformId,
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
            const allProjects = await platformProjectService.getAll({
                ownerId: request.principal.id,
            })
            const project = allProjects.find((project) => project.id === request.params.projectId)
            if (!project) {
                throw new ActivepiecesError({
                    code: ErrorCode.ENTITY_NOT_FOUND,
                    params: {
                        entityId: request.params.projectId,
                        entityType: 'project',
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

    fastify.post( '/:projectId', UpdateProjectRequest, async (request) => {
        return platformProjectService.update({
            platformId: request.principal.platform?.id,
            projectId: request.params.projectId,
            userId: request.principal.id,
            request: request.body,
        })

    })

    done()
}

const UpdateProjectRequest = {
    schema: {
        tags: ['projects'],
        params: Type.Object({
            projectId: Type.String(),
        }),
        Response: {
            [StatusCodes.OK]: Project,
        },
        body: UpdateProjectPlatformRequest,
    },
}

const CreateProjectRequest =   {
    schema: {
        tags: ['projects'],
        Response: {
            [StatusCodes.OK]: Project,
        },
        body: CreatePlatformProjectRequest,
    },
}

const ListProjectRequest = {
    schema: {
        response: {
            [StatusCodes.OK]: SeekPage(Project),
        },
        tags: ['projects'],
        querystring: Type.Object({
            platformId: Type.Optional(Type.String()),
        }),
    },
}
