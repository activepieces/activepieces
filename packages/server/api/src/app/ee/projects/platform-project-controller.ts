import {
    ActivepiecesError,
    assertNotNullOrUndefined,
    CreatePlatformProjectRequest,
    ErrorCode,
    ListProjectRequestForPlatformQueryParams,
    Permission,
    PlatformRole,
    Principal,
    PrincipalType,
    ProjectType,
    ProjectWithLimits,
    SeekPage,
    SERVICE_KEY_SECURITY_OPENAPI,
    TeamProjectsLimit,
    UpdateProjectPlatformRequest,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { ProjectResourceType } from '../../core/security/authorization/common'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { platformService } from '../../platform/platform.service'
import { projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'
import { platformProjectService } from './platform-project-service'

const DEFAULT_LIMIT_SIZE = 50

export const platformProjectController: FastifyPluginAsyncZod = async (app) => {

    app.get('/:id', GetProjectRequest, async (request) => {
        return platformProjectService(request.log).getWithPlanAndUsageOrThrow(request.projectId)
    })


    app.post('/', CreateProjectRequest, async (request, reply) => {
        const platformId = request.principal.platform.id
        assertNotNullOrUndefined(platformId, 'platformId')
        await assertMaximumNumberOfProjectsReachedByEdition(platformId, request.log)
        const projectWithUsage = await platformProjectService(request.log).create({
            platformId,
            displayName: request.body.displayName,
            externalId: request.body.externalId ?? undefined,
            metadata: request.body.metadata ?? undefined,
            maxConcurrentJobs: request.body.maxConcurrentJobs ?? undefined,
            globalConnectionExternalIds: request.body.globalConnectionExternalIds ?? undefined,
        })
        await reply.status(StatusCodes.CREATED).send(projectWithUsage)
    })

    app.get('/', ListProjectRequestForPlatform, async (request, _reply) => {
        const userId = await getUserId(request.principal, request.log)
        const user = await userService(request.log).getOneOrFail({ id: userId })
        return platformProjectService(request.log).getForPlatform({
            platformId: request.principal.platform.id,
            externalId: request.query.externalId,
            externalUserId: request.query.externalUserId,
            cursorRequest: request.query.cursor ?? null,
            displayName: request.query.displayName,
            types: request.query.types,
            limit: request.query.limit ?? DEFAULT_LIMIT_SIZE,
            userId,
            isPrivileged: userService(request.log).isUserPrivileged(user),
            principalType: request.principal.type,
        })
    })

    app.post('/:id', UpdateProjectRequest, async (request) => {
        const project = await projectService(request.log).getOneOrThrow(request.params.id)
        const haveTokenForTheProject = request.projectId === project.id
        const ownThePlatform = await isPlatformAdmin({
            platformId: request.principal.platform.id,
            type: request.principal.type,
            id: request.principal.id,
        }, project.platformId, request.log)
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
        await assertProjectIsSafeToDelete(req.params.id, req.principal.platform.id, req.log)
        await platformProjectService(req.log).markForDeletion({
            id: req.params.id,
            platformId: req.principal.platform.id,
        })

        return res.status(StatusCodes.NO_CONTENT).send()
    })
}

async function getUserId(principal: Principal, log: FastifyBaseLogger): Promise<string> {
    if (principal.type === PrincipalType.SERVICE) {
        const platform = await platformService(log).getOneOrThrow(principal.platform.id)
        return platform.ownerId
    }
    return principal.id
}

async function isPlatformAdmin(principal: {
    platformId: string
    type: PrincipalType
    id: string
}, projectPlatformId: string, log: FastifyBaseLogger): Promise<boolean> {
    if (principal.platformId !== projectPlatformId) {
        return false
    }
    if (principal.type === PrincipalType.SERVICE) {
        return true
    }
    const user = await userService(log).getOneOrFail({
        id: principal.id,
    })
    return user.platformRole === PlatformRole.ADMIN
}




async function assertProjectIsSafeToDelete(projectId: string, callerPlatformId: string, log: FastifyBaseLogger): Promise<void> {
    const project = await projectService(log).getOneOrThrow(projectId)
    if (project.platformId !== callerPlatformId) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                entityType: 'project',
                entityId: projectId,
            },
        })
    }
    if (project.type === ProjectType.PERSONAL) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: 'Personal projects cannot be deleted',
            },
        })
    }
}

async function assertMaximumNumberOfProjectsReachedByEdition(platformId: string, log: FastifyBaseLogger): Promise<void> {
    const platform = await platformService(log).getOneWithPlanOrThrow(platformId)

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
            const projectsCount = await projectService(log).countByPlatformIdAndType(platformId, ProjectType.TEAM)
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
        params: z.object({
            id: z.string(),
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
        params: z.object({
            id: z.string(),
        }),
        tags: ['projects'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
    },
}
