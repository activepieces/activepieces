import { EndpointScope, PrincipalType, ProjectType, SeekPage, assertNotNullOrUndefined } from '@activepieces/shared'
import { FastifyPluginCallbackTypebox, Type } from '@fastify/type-provider-typebox'
import { platformProjectService } from './platform-project-service'
import { projectService } from '../../project/project-service'
import { CreatePlatformProjectRequest, DEFAULT_PLATFORM_PLAN, ProjectWithUsageAndPlanResponse, UpdateProjectPlatformRequest } from '@activepieces/ee-shared'
import { plansService } from '../billing/project-plan/project-plan.service'
import { StatusCodes } from 'http-status-codes'
import { platformService } from '../platform/platform.service'

export const platformProjectController: FastifyPluginCallbackTypebox = (fastify, _opts, done) => {
    fastify.post('/', CreateProjectRequest, async (request, reply) => {
        const platformId = request.principal.platform?.id
        assertNotNullOrUndefined(platformId, 'platformId')
        const platform = await platformService.getOneOrThrow(platformId)

        const project = await projectService.create({
            ownerId: platform.ownerId,
            displayName: request.body.displayName,
            platformId,
            type: ProjectType.PLATFORM_MANAGED,
        })
        await plansService.update({
            projectId: project.id,
            subscription: null,
            planLimits: DEFAULT_PLATFORM_PLAN,
        })
        const projectWithUsage = await platformProjectService.getWithPlanAndUsageOrThrow(project.id)
        await reply.status(StatusCodes.CREATED).send(projectWithUsage)
    },
    )

    fastify.get('/', ListProjectRequestForApiKey, async (request) => {
        const platformId = request.principal.platform?.id
        assertNotNullOrUndefined(platformId, 'platformId')
        return platformProjectService.getAll({
            platformId,
            externalId: request.query.externalId,
            ownerId: undefined,
        })
    })


    fastify.post('/:id', UpdateProjectRequest, async (request) => {
        let userId = request.principal.id
        if (request.principal.type === PrincipalType.SERVICE) {
            const platformId = request.principal.platform?.id
            assertNotNullOrUndefined(platformId, 'platformId')
            const platform = await platformService.getOneOrThrow(platformId)
            userId = platform.ownerId
        }
        return platformProjectService.update({
            platformId: request.principal.platform?.id,
            projectId: request.params.id,
            userId,
            request: request.body,
        })

    })

    done()
}


const UpdateProjectRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
    },
    schema: {
        tags: ['projects'],
        params: Type.Object({
            id: Type.String(),
        }),
        response: {
            [StatusCodes.OK]: ProjectWithUsageAndPlanResponse,
        },
        body: UpdateProjectPlatformRequest,
    },
}

const CreateProjectRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
    },
    schema: {
        tags: ['projects'],
        response: {
            [StatusCodes.CREATED]: ProjectWithUsageAndPlanResponse,
        },
        body: CreatePlatformProjectRequest,
    },
}

const ListProjectRequestForApiKey = {
    config: {
        allowedPrincipals: [PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
    },
    schema: {
        response: {
            [StatusCodes.OK]: SeekPage(ProjectWithUsageAndPlanResponse),
        },
        querystring: Type.Object({
            externalId: Type.Optional(Type.String()),
        }),
        tags: ['projects'],
    },
}
