import {
    CreatePlatformProjectRequest,
    ListProjectRequestForPlatformQueryParams,
    UpdateProjectPlatformRequest,
} from '@activepieces/ee-shared'
import { ProjectResourceType, securityAccess } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    assertNotNullOrUndefined,
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
import { platformProjectService } from './platform-project-service'
import { projectLimitsService } from './project-plan/project-plan.service'

const DEFAULT_LIMIT_SIZE = 50

export const platformProjectController: FastifyPluginAsyncTypebox = async (app) => {


    app.get('/:id', GetProjectRequest, async (request) => {
        return platformProjectService(request.log).getWithPlanAndUsageOrThrow(request.projectId)
    })


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

    app.get('/', ListProjectRequestForPlatform, async (request, _reply) => {
        const userId = await getUserId(request.principal)
        const user = await userService.getOneOrFail({ id: userId })
        return platformProjectService(request.log).getForPlatform({
            platformId: request.principal.platform.id,
            externalId: request.query.externalId,
            cursorRequest: request.query.cursor ?? null,
            displayName: request.query.displayName,
            types: request.query.types,
            limit: request.query.limit ?? DEFAULT_LIMIT_SIZE,
            userId,
            isPrivileged: userService.isUserPrivileged(user),
        })
    })

    app.post('/:id', UpdateProjectRequest, async (request) => {
        const project = await projectService.getOneOrThrow(request.params.id)
        const haveTokenForTheProject = request.projectId === project.id
        const ownThePlatform = await isPlatformAdmin(request.principal as ServicePrincipal | UserPrincipal, project.platformId)
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

const GetProjectRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE],
            undefined, {
                type: ProjectResourceType.PARAM,
                paramKey: 'id',
            }),
    },
}

const UpdateProjectRequest = {
    config: {
        security: securityAccess.project([PrincipalType.USER, PrincipalType.SERVICE], Permission.WRITE_PROJECT, {
            type: ProjectResourceType.PARAM,
            paramKey: 'id',
        }),
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
        security: securityAccess.publicPlatform([PrincipalType.USER, PrincipalType.SERVICE]),
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
        security: securityAccess.publicPlatform([PrincipalType.USER, PrincipalType.SERVICE]),
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
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
        tags: ['projects'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
    },
}
