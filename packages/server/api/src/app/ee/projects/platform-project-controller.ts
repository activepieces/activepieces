import {
    ActivepiecesError,
    EndpointScope,
    ErrorCode,
    PlatformRole,
    PrincipalType,
    ProjectWithLimits,
    SERVICE_KEY_SECURITY_OPENAPI,
    SeekPage,
    assertNotNullOrUndefined,
} from '@activepieces/shared'
import {
    FastifyPluginCallbackTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { platformProjectService } from './platform-project-service'
import { projectService } from '../../project/project-service'
import {
    CreatePlatformProjectRequest,
    DEFAULT_PLATFOR_LIMIT,
    UpdateProjectPlatformRequest,
} from '@activepieces/ee-shared'
import { StatusCodes } from 'http-status-codes'
import { platformService } from '../../platform/platform.service'
import { projectLimitsService } from '../project-plan/project-plan.service'

export const platformProjectController: FastifyPluginCallbackTypebox = (
    fastify,
    _opts,
    done,
) => {
    fastify.post('/', CreateProjectRequest, async (request, reply) => {
        const platformId = request.principal.platform.id
        assertNotNullOrUndefined(platformId, 'platformId')
        const platform = await platformService.getOneOrThrow(platformId)

        const project = await projectService.create({
            ownerId: platform.ownerId,
            displayName: request.body.displayName,
            platformId,
            externalId: request.body.externalId,
        })
        await projectLimitsService.upsert(DEFAULT_PLATFOR_LIMIT, project.id)
        const projectWithUsage =
            await platformProjectService.getWithPlanAndUsageOrThrow(project.id)
        await reply.status(StatusCodes.CREATED).send(projectWithUsage)
    })

    fastify.get('/', ListProjectRequestForApiKey, async (request) => {
        const platformId = request.principal.platform.id
        assertNotNullOrUndefined(platformId, 'platformId')
        return platformProjectService.getAll({
            platformId,
            externalId: request.query.externalId,
            ownerId: undefined,
        })
    })

    fastify.post('/:id', UpdateProjectRequest, async (request) => {
        const project = await projectService.getOneOrThrow(request.params.id)
        const haveTokenForTheProject = request.principal.projectId === project.id
        const ownThePlatform = request.principal.platform.role === PlatformRole.OWNER && request.principal.platform.id === project.platformId
        if (!haveTokenForTheProject && !ownThePlatform) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {},
            })
        }       
        return platformProjectService.update({
            platformId: request.principal.platform.id,
            projectId: request.params.id,
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
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: Type.Object({
            id: Type.String(),
        }),
        response: {
            [StatusCodes.OK]: ProjectWithLimits,
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
            [StatusCodes.CREATED]: ProjectWithLimits,
        },
        security: [SERVICE_KEY_SECURITY_OPENAPI],
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
            [StatusCodes.OK]: SeekPage(ProjectWithLimits),
        },
        querystring: Type.Object({
            externalId: Type.Optional(Type.String()),
        }),
        tags: ['projects'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
    },
}
