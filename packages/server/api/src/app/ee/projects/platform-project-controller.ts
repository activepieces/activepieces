import {
    CreatePlatformProjectRequest,
    DEFAULT_PLATFORM_LIMIT,
    UpdateProjectPlatformRequest,
} from '@activepieces/ee-shared'
import {
    ActivepiecesError,
    assertNotNullOrUndefined,
    EndpointScope,
    ErrorCode,
    Permission,
    PlatformRole,
    Principal,
    PrincipalType,
    ProjectWithLimits,
    SeekPage,
    SERVICE_KEY_SECURITY_OPENAPI,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { platformService } from '../../platform/platform.service'
import { projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'
import { platformMustBeOwnedByCurrentUser } from '../authentication/ee-authorization'
import { projectLimitsService } from '../project-plan/project-plan.service'
import { platformProjectService } from './platform-project-service'

const DEFAULT_LIMIT_SIZE = 50

export const platformProjectController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/', CreateProjectRequest, async (request, reply) => {
        const platformId = request.principal.platform.id
        assertNotNullOrUndefined(platformId, 'platformId')
        const platform = await platformService.getOneOrThrow(platformId)

        const project = await projectService.create({
            ownerId: platform.ownerId,
            displayName: request.body.displayName,
            platformId,
            externalId: request.body.externalId,
        })
        await projectLimitsService.upsert(DEFAULT_PLATFORM_LIMIT, project.id)
        const projectWithUsage =
            await platformProjectService.getWithPlanAndUsageOrThrow(project.id)
        await reply.status(StatusCodes.CREATED).send(projectWithUsage)
    })

    app.get('/', ListProjectRequestForApiKey, async (request) => {
        const platformId = request.principal.platform.id
        assertNotNullOrUndefined(platformId, 'platformId')
        return platformProjectService.getAll({
            externalId: request.query.externalId,
            principalType: request.principal.type,
            principalId: request.principal.id,
            platformId: request.principal.platform.id,
            cursorRequest: request.query.cursor ?? null,
            limit: request.query.limit ?? DEFAULT_LIMIT_SIZE,
        })
    })

    app.post('/:id', UpdateProjectRequest, async (request) => {
        const project = await projectService.getOneOrThrow(request.params.id)
        const haveTokenForTheProject = request.principal.projectId === project.id
        const ownThePlatform = await isPlatformAdmin(request.principal, project.platformId)
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

    app.delete('/:id', DeleteProjectRequest, async (req, res) => {
        await platformMustBeOwnedByCurrentUser.call(app, req, res)
        assertProjectToDeleteIsNotPrincipalProject(req.principal, req.params.id)

        await platformProjectService.softDelete({
            id: req.params.id,
            platformId: req.principal.platform.id,
        })

        return res.status(StatusCodes.NO_CONTENT).send()
    })
}

async function isPlatformAdmin(principal: Principal, platformId: string): Promise<boolean> {
    if (principal.platform.id !== platformId) {
        return false
    }
    if (principal.type === PrincipalType.SERVICE) {
        return true
    }
    const user = await userService.getMetaInfo({
        id: principal.id,
    })
    assertNotNullOrUndefined(user, 'user can not be null')
    return user.platformRole === PlatformRole.ADMIN
}

const assertProjectToDeleteIsNotPrincipalProject = (principal: Principal, projectId: string): void => {
    if (principal.projectId === projectId) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: 'ACTIVE_PROJECT',
            },
        })
    }
}

const UpdateProjectRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
        permission: Permission.WRITE_PROJECT,
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
            limit: Type.Optional(Type.Number({})),
            cursor: Type.Optional(Type.String({})),
        }),
        tags: ['projects'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
    },
}

const DeleteProjectRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        scope: EndpointScope.PLATFORM,
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
        tags: ['projects'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
    },
}
