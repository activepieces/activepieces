import {
    CreatePlatformProjectRequest,
    ListProjectRequestForPlatformQueryParams,
    UpdateProjectPlatformRequest,
} from '@activepieces/ee-shared'
import {
    ActivepiecesError,
    assertNotNullOrUndefined,
    EndpointScope,
    ErrorCode,
    Permission,
    PiecesFilterType,
    PlatformRole,
    Principal,
    PrincipalType,
    ProjectType,
    ProjectWithLimits,
    SeekPage,
    SERVICE_KEY_SECURITY_OPENAPI,
    ServicePrincipal,
    TeamProjectsLimit,
    UserPrincipal,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { platformService } from '../../platform/platform.service'
import { projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'
import { platformMustBeOwnedByCurrentUser } from '../authentication/ee-authorization'
import { platformProjectService } from './platform-project-service'
import { projectLimitsService } from './project-plan/project-plan.service'

const DEFAULT_LIMIT_SIZE = 50

export const platformProjectController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/', CreateProjectRequest, async (request, reply) => {
        const platformId = request.principal.platform.id
        assertNotNullOrUndefined(platformId, 'platformId')
        await assertMaximumNumberOfProjectsReachedByEdition(platformId)

        const platform = await platformService.getOneOrThrow(platformId)

        const project = await projectService.create({
            ownerId: platform.ownerId,
            displayName: request.body.displayName,
            platformId,
            externalId: request.body.externalId ?? undefined,
            metadata: request.body.metadata ?? undefined,
            maxConcurrentJobs: request.body.maxConcurrentJobs ?? undefined,
            type: ProjectType.TEAM,
        })
        await projectLimitsService(request.log).upsert({
            nickname: 'platform',
            pieces: [],
            piecesFilterType: PiecesFilterType.NONE,
        }, project.id)
        const projectWithUsage =
            await platformProjectService(request.log).getWithPlanAndUsageOrThrow(project.id)
        await reply.status(StatusCodes.CREATED).send(projectWithUsage)
    })

    app.get('/', ListProjectRequestForPlatform, async (request, reply) => {
        await platformMustBeOwnedByCurrentUser.call(app, request, reply)

        const userId = await getUserId(request.principal)
        return platformProjectService(request.log).getAllForPlatform({
            platformId: request.principal.platform.id,
            externalId: request.query.externalId,
            cursorRequest: request.query.cursor ?? null,
            displayName: request.query.displayName,
            types: request.query.types,
            limit: request.query.limit ?? DEFAULT_LIMIT_SIZE,
            userId,
            scope: EndpointScope.PLATFORM,
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
        return platformProjectService(request.log).update({
            platformId: request.principal.platform.id,
            projectId: request.params.id,
            request: {
                ...request.body,
                externalId: ownThePlatform ? request.body.externalId : undefined,
            },
        })
    })

    app.delete('/:id', DeleteProjectRequest, async (req, res) => {
        await platformMustBeOwnedByCurrentUser.call(app, req, res)
        assertProjectToDeleteIsNotPrincipalProject(req.principal, req.params.id)
        await assertProjectToDeleteIsNotPersonalProject(req.params.id)

        await platformProjectService(req.log).hardDelete({
            id: req.params.id,
            platformId: req.principal.platform.id,
        })

        return res.status(StatusCodes.NO_CONTENT).send()
    })
}

async function getUserId(principal: Principal): Promise<string> {
    if (principal.type === PrincipalType.SERVICE) {
        const platform = await platformService.getOneOrThrow(principal.platform.id)
        return platform.ownerId
    }
    return principal.id
}

async function isPlatformAdmin(principal: ServicePrincipal | UserPrincipal, platformId: string): Promise<boolean> {
    if (principal.platform.id !== platformId) {
        return false
    }
    if (principal.type === PrincipalType.SERVICE) {
        return true
    }
    const user = await userService.getOneOrFail({
        id: principal.id,
    })
    return user.platformRole === PlatformRole.ADMIN
}

const assertProjectToDeleteIsNotPrincipalProject = (principal: ServicePrincipal | UserPrincipal, projectId: string): void => {
    if (principal.projectId === projectId) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: 'ACTIVE_PROJECT',
            },
        })
    }
}

async function assertProjectToDeleteIsNotPersonalProject(projectId: string): Promise<void> {
    const project = await projectService.getOneOrThrow(projectId)
    if (project.type === ProjectType.PERSONAL) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: 'Personal projects cannot be deleted',
            },
        })
    }
}

async function assertMaximumNumberOfProjectsReachedByEdition(platformId: string): Promise<void> {
    const platform = await platformService.getOneWithPlanOrThrow(platformId)

    switch (platform.plan.teamProjectsLimit) {
        case TeamProjectsLimit.NONE: {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Team projects are not available on your current plan',
                },
            })
        }
        case TeamProjectsLimit.ONE: {
            const projectsCount = await projectService.countByPlatformIdAndType(platformId, ProjectType.TEAM)
            if (projectsCount >= 1) {
                throw new ActivepiecesError({
                    code: ErrorCode.FEATURE_DISABLED,
                    params: {
                        message: 'Maximum limit of 1 team project reached for this plan. Upgrade your plan to add more team projects.',
                    },
                })
            }
            break
        }
        case TeamProjectsLimit.UNLIMITED: {
            break
        }
    }
}

const UpdateProjectRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE] as const,
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
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE] as const,
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

const ListProjectRequestForPlatform = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE] as const,
        scope: EndpointScope.PLATFORM,
    },
    schema: {
        response: {
            [StatusCodes.OK]: SeekPage(ProjectWithLimits),
        },
        querystring: ListProjectRequestForPlatformQueryParams,
        tags: ['projects'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
    },
}

const DeleteProjectRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE] as const,
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
