import { ActivepiecesError, assertNotNullOrUndefined, ErrorCode, isNil, Permission, ProjectRole, RoleType, SeekPage } from '@activepieces/core-utils'
import { ApplicationEventName, INVITATION_EXPIRY_SECONDS, InvitationStatus, InvitationType, ListUserInvitationsRequest, PlatformRole, Principal, PrincipalType, ProjectType, RemoveProjectFromInvitationResponse, SendUserInvitationRequest, SERVICE_KEY_SECURITY_OPENAPI, ServicePrincipal, TelemetryEvent, TelemetryEventName, UserInvitation, UserInvitationEvent, UserInvitationPreview, UserInvitationWithLink, UserPrincipal } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { userIdentityService } from '../authentication/user-identity/user-identity-service'
import { transaction } from '../core/db/transaction'
import { ProjectResourceType } from '../core/security/authorization/common'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { authnRateLimit } from '../core/security/rate-limit'
import { distributedLock } from '../database/redis-connections'
import { platformMustBeOwnedByCurrentUser, platformMustHaveFeatureEnabled, projectMustBeTeamType } from '../ee/authentication/ee-authorization'
import { assertRoleHasPermission } from '../ee/authentication/project-role/rbac-middleware'
import { platformPlanService } from '../ee/platform/platform-plan/platform-plan.service'
import { projectRoleRepo, projectRoleService } from '../ee/projects/project-role/project-role.service'
import { applicationEvents, MetaInformation } from '../helper/application-events'
import { networkUtils } from '../helper/network-utils'
import { rejectedPromiseHandler } from '../helper/promise-handler'
import { telemetry } from '../helper/telemetry.utils'
import { projectService } from '../project/project-service'
import { userService } from '../user/user-service'
import { userInvitationsService } from './user-invitation.service'

export const invitationModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(invitationController, { prefix: '/v1/user-invitations' })
}

const invitationController: FastifyPluginAsyncZod = async (app) => {

    app.post('/', UpsertUserInvitationRequestParams, async (request, reply) => {
        const { email, type } = request.body
        switch (type) {
            case InvitationType.PROJECT:
                await projectMustBeTeamType.call(app, request, reply)
                await assertPrincipalHasPermissionToProject(app, request, reply, request.principal, request.body.projectId, Permission.WRITE_INVITATION)
                break
            case InvitationType.PLATFORM:
                await platformMustBeOwnedByCurrentUser.call(app, request, reply)
                await assertPlatformInviteProject({ app, request, reply, invitation: request.body, platformId: request.principal.platform.id })
                break
        }
        const platformId = request.principal.platform.id
        const status = await shouldAutoAcceptInvitation(request.principal, request.body, platformId, request.log) ? InvitationStatus.ACCEPTED : InvitationStatus.PENDING
        const projectRole = await getProjectRoleAndAssertIfFound(platformId, request.body)

        const invitationRecordParams = {
            email,
            type,
            platformId,
            platformRole: type === InvitationType.PROJECT ? null : request.body.platformRole,
            projectId: request.body.projectId ?? null,
            projectRoleId: projectRole?.id ?? null,
            status,
        }

        const userInvitationRecord = await distributedLock(request.log).runExclusive({
            key: `user-invitation:${platformId}:${email.toLowerCase().trim()}`,
            timeoutInSeconds: 30,
            fn: async () => {
                const wouldAddNewUser = await userInvitationsService(request.log).wouldAddNewUser({ email, platformId })
                return transaction(async (entityManager) => {
                    if (wouldAddNewUser) {
                        const additionalSeatsNeeded = await userInvitationsService(request.log).countAdditionalSeatsNeeded({
                            email,
                            platformId,
                            entityManager,
                        })
                        await platformPlanService(request.log).checkUsersExceededLimit({ platformId, entityManager, additionalSeatsNeeded })
                    }
                    return userInvitationsService(request.log).createInvitationRecord({ ...invitationRecordParams, entityManager })
                })
            },
        })

        const invitation = await userInvitationsService(request.log).finalizeInvitation({
            userInvitation: userInvitationRecord,
            invitationExpirySeconds: INVITATION_EXPIRY_SECONDS,
            resent: status === InvitationStatus.PENDING && userInvitationRecord.status === InvitationStatus.ACCEPTED,
        })
        applicationEvents(request.log).sendUserEvent(invitationEventSource({ request, invitation, userId: actingUserId(request) }), {
            action: ApplicationEventName.USER_INVITATION_SENT,
            data: await auditedInvitationData(invitation),
        })
        rejectedPromiseHandler(trackInviteSent({
            principal: request.principal,
            platformId,
            event: {
                name: TelemetryEventName.INVITE_SENT,
                payload: {
                    platformId,
                    type: type === InvitationType.PLATFORM ? 'platform' : 'project',
                    role: type === InvitationType.PLATFORM ? request.body.platformRole ?? undefined : projectRole?.name,
                },
            },
            log: request.log,
        }), request.log)
        await reply.status(StatusCodes.CREATED).send(invitation)
    })

    app.get('/', ListUserInvitationsRequestParams, async (request, reply) => {
        if (!isNil(request.query.projectId) && request.query.type === InvitationType.PROJECT) {
            await projectMustBeTeamType.call(app, request, reply)
        }
        const projectId = await getProjectIdAndAssertPermission(app, request, reply, request.principal, {
            ...request.query,
            projectId: request.query.projectId === '' ? null : request.query.projectId,
        })
        const invitations = await userInvitationsService(request.log).list({
            platformId: request.principal.platform.id,
            projectId,
            type: request.query.type,
            status: request.query.status,
            cursor: request.query.cursor ?? null,
            limit: request.query.limit ?? 10,
        })
        await reply.status(StatusCodes.OK).send(invitations)
    })

    app.get('/preview', PreviewUserInvitationRequestParams, async (request, reply) => {
        const preview = await userInvitationsService(request.log).getPreviewByInvitationToken(request.query.token)
        await reply.status(StatusCodes.OK).send(preview)
    })

    app.post('/accept', AcceptUserInvitationRequestParams, async (request, reply) => {
        const invitation = await userInvitationsService(request.log).getOneByInvitationTokenOrThrow(request.body.invitationToken)
        const { registered, firstAcceptance } = await userInvitationsService(request.log).accept({
            invitationId: invitation.id,
            platformId: invitation.platformId,
        })
        if (firstAcceptance) {
            applicationEvents(request.log).sendUserEvent(invitationEventSource({ request, invitation, userId: null }), {
                action: ApplicationEventName.USER_INVITATION_ACCEPTED,
                data: await auditedInvitationData(invitation),
            })
        }
        await landNextSignInOnInvitedPlatform({ email: invitation.email, platformId: invitation.platformId, log: request.log })
        await reply.status(StatusCodes.OK).send({ ...invitation, registered })
    })

    app.post('/:id/remove-project', RemoveProjectFromInvitationRequestParams, async (request, reply) => {
        await platformMustBeOwnedByCurrentUser.call(app, request, reply)
        const invitation = await userInvitationsService(request.log).getOneOrThrow({
            id: request.params.id,
            platformId: request.principal.platform.id,
        })
        const result = await userInvitationsService(request.log).removeProjectFromPlatformInvite({
            id: request.params.id,
            platformId: request.principal.platform.id,
            projectId: request.body.projectId,
        })
        if (result.revoked) {
            applicationEvents(request.log).sendUserEvent(invitationEventSource({ request, invitation, userId: actingUserId(request) }), {
                action: ApplicationEventName.USER_INVITATION_DELETED,
                data: await auditedInvitationData(invitation),
            })
        }
        await reply.status(StatusCodes.OK).send(result)
    })

    app.delete('/:id', DeleteInvitationRequestParams, async (request, reply) => {
        const invitation = await userInvitationsService(request.log).getOneOrThrow({
            id: request.params.id,
            platformId: request.principal.platform.id,
        })
        switch (invitation.type) {
            case InvitationType.PROJECT: {
                assertNotNullOrUndefined(invitation.projectId, 'projectId')
                const platformAdmin = await isPlatformAdmin({ principal: request.principal, log: request.log })
                if (!platformAdmin) {
                    await assertPrincipalHasPermissionToProject(app, request, reply, request.principal, invitation.projectId, Permission.WRITE_INVITATION)
                }
                break
            }
            case InvitationType.PLATFORM:
                await platformMustBeOwnedByCurrentUser.call(app, request, reply)
                break
        }
        await userInvitationsService(request.log).delete({
            id: request.params.id,
            platformId: request.principal.platform.id,
        })
        applicationEvents(request.log).sendUserEvent(invitationEventSource({ request, invitation, userId: actingUserId(request) }), {
            action: ApplicationEventName.USER_INVITATION_DELETED,
            data: await auditedInvitationData(invitation),
        })
        await reply.status(StatusCodes.NO_CONTENT).send()
    })
}


const getProjectRoleAndAssertIfFound = async (platformId: string, request: SendUserInvitationRequest): Promise<ProjectRole | null> => {
    const projectRoleName = request.projectRole
    if (isNil(projectRoleName)) {
        return null
    }

    const projectRole = await projectRoleService.getOneOrThrow({
        name: projectRoleName,
        platformId,
    })
    return projectRole
}
async function landNextSignInOnInvitedPlatform({ email, platformId, log }: LandNextSignInOnInvitedPlatformParams): Promise<void> {
    const identity = await userIdentityService(log).getIdentityByEmail(email)
    if (isNil(identity)) {
        return
    }
    await userIdentityService(log).updateLastLoggedInPlatformId({ id: identity.id, lastLoggedInPlatformId: platformId })
}

async function assertPlatformInviteProject({ app, request, reply, invitation, platformId }: AssertPlatformInviteProjectParams): Promise<void> {
    if (invitation.type !== InvitationType.PLATFORM || (isNil(invitation.projectId) && isNil(invitation.projectRole))) {
        return
    }
    if (isNil(invitation.projectId) || isNil(invitation.projectRole)) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: 'projectId and projectRole must be sent together',
            },
        })
    }
    if (invitation.platformRole !== PlatformRole.MEMBER) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: 'Only a Member invite can name a project',
            },
        })
    }
    await platformMustHaveFeatureEnabled((platform) => platform.plan.projectRolesEnabled).call(app, request, reply)
    const project = await projectService(request.log).getOne(invitation.projectId)
    if (isNil(project) || project.platformId !== platformId || project.type !== ProjectType.TEAM) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: 'The project must be a team project of this platform',
            },
        })
    }
}

async function getProjectIdAndAssertPermission<R extends Principal>(
    app: FastifyInstance,
    request: FastifyRequest,
    reply: FastifyReply,
    principal: R,
    requestQuery: ListUserInvitationsRequest,
): Promise<string | null> {
    if (principal.type === PrincipalType.SERVICE) {
        if (isNil(requestQuery.projectId)) {
            return null
        }
        await assertPrincipalHasPermissionToProject(app, request, reply, principal, requestQuery.projectId, Permission.READ_INVITATION)
        return requestQuery.projectId
    }
    return requestQuery.projectId ?? null
}

async function shouldAutoAcceptInvitation(principal: Principal, request: SendUserInvitationRequest, platformId: string, log: FastifyBaseLogger): Promise<boolean> {
    if (principal.type === PrincipalType.SERVICE) {
        return true
    }

    if (request.type === InvitationType.PLATFORM) {
        return false
    }

    const identity = await userIdentityService(log).getIdentityByEmail(request.email)
    if (isNil(identity)) {
        return false
    }

    const user = await userService(log).getOneByIdentityAndPlatform({
        identityId: identity.id,
        platformId,
    })
    return !isNil(user)
}

async function assertPrincipalHasPermissionToProject<R extends Principal & { platform: { id: string } }>(
    fastify: FastifyInstance,
    request: FastifyRequest, reply: FastifyReply, principal: R,
    projectId: string, permission: Permission): Promise<void> {
    const project = await projectService(request.log).getOneOrThrow(projectId)
    if (isNil(project) || project.platformId !== principal.platform.id) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'user does not have access to the project',
            },
        })
    }
    await platformMustHaveFeatureEnabled((platform) => platform.plan.projectRolesEnabled).call(fastify, request, reply)
    await assertRoleHasPermission(request.principal, projectId, permission, request.log)
}

async function isPlatformAdmin({ principal, log }: IsPlatformAdminParams): Promise<boolean> {
    if (principal.type === PrincipalType.SERVICE) {
        return true
    }
    const user = await userService(log).getOneOrFail({ id: principal.id })
    return user.platformRole === PlatformRole.ADMIN && user.platformId === principal.platform.id
}


async function trackInviteSent({ principal, platformId, event, log }: TrackInviteSentParams): Promise<void> {
    if (principal.type === PrincipalType.USER) {
        await telemetry(log).trackUser({ userId: principal.id, platformId, event })
        return
    }
    await telemetry(log).trackPlatform({ platformId, event })
}

async function auditedInvitationData(invitation: UserInvitation): Promise<UserInvitationEvent['data']> {
    const projectRole = isNil(invitation.projectRoleId) ? null : await projectRoleRepo().findOneBy([
        { id: invitation.projectRoleId, platformId: invitation.platformId },
        { id: invitation.projectRoleId, type: RoleType.DEFAULT },
    ])
    return {
        invitation: {
            id: invitation.id,
            email: invitation.email,
            type: invitation.type,
            platformRole: invitation.platformRole,
            projectId: invitation.projectId,
        },
        projectRole: isNil(projectRole) ? null : { id: projectRole.id, name: projectRole.name },
    }
}

function invitationEventSource({ request, invitation, userId }: InvitationEventSourceParams): MetaInformation {
    return {
        platformId: invitation.platformId,
        projectId: invitation.projectId ?? undefined,
        userId,
        ip: networkUtils.clientIp(request),
        fallBackToProjectOwner: false,
    }
}

function actingUserId(request: FastifyRequest): string | null {
    return request.principal.type === PrincipalType.USER ? request.principal.id : null
}

const ListUserInvitationsRequestParams = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER, PrincipalType.SERVICE], {
            type: ProjectResourceType.QUERY,
            queryKey: 'projectId',
        }),
    },
    schema: {
        tags: ['user-invitations'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: ListUserInvitationsRequest,
        response: {
            [StatusCodes.OK]: SeekPage(UserInvitation),
        },
    },
}

const PreviewUserInvitationRequestParams = {
    config: {
        security: securityAccess.public(),
        rateLimit: authnRateLimit,
    },
    schema: {
        querystring: z.object({
            token: z.string(),
        }),
        response: {
            [StatusCodes.OK]: UserInvitationPreview,
        },
    },
}

const AcceptUserInvitationRequestParams = {
    config: {
        security: securityAccess.public(),
        rateLimit: authnRateLimit,
    },
    schema: {
        body: z.object({
            invitationToken: z.string(),
        }),
    },
}

const DeleteInvitationRequestParams = {
    config: {
        security: securityAccess.unscoped([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        tags: ['user-invitations'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: z.object({
            id: z.string(),
        }),
        response: {
            [StatusCodes.NO_CONTENT]: z.never(),
        },
    },
}

const RemoveProjectFromInvitationRequestParams = {
    config: {
        security: securityAccess.unscoped([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        tags: ['user-invitations'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'Take the project off a platform invitation. When it is a Member invite and new members get no personal project and no default projects, the invitation is revoked instead, since they would have nowhere to land; their project invitations are not affected.',
        params: z.object({
            id: z.string(),
        }),
        body: z.object({
            projectId: z.string(),
        }),
        response: {
            [StatusCodes.OK]: RemoveProjectFromInvitationResponse,
        },
    },
}

const UpsertUserInvitationRequestParams = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER, PrincipalType.SERVICE], {
            type: ProjectResourceType.BODY,
        }),
    },
    schema: {
        body: SendUserInvitationRequest,
        description: 'Send a user invitation to a user. If the user already has an invitation, the invitation will be updated.',
        tags: ['user-invitations'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        response: {
            [StatusCodes.CREATED]: UserInvitationWithLink,
        },
    },
}

type LandNextSignInOnInvitedPlatformParams = {
    email: string
    platformId: string
    log: FastifyBaseLogger
}

type AssertPlatformInviteProjectParams = {
    app: FastifyInstance
    request: FastifyRequest
    reply: FastifyReply
    invitation: SendUserInvitationRequest
    platformId: string
}

type TrackInviteSentParams = {
    principal: Principal
    platformId: string
    event: TelemetryEvent
    log: FastifyBaseLogger
}

type InvitationEventSourceParams = {
    request: FastifyRequest
    invitation: UserInvitation
    userId: string | null
}

type IsPlatformAdminParams = {
    principal: UserPrincipal | ServicePrincipal
    log: FastifyBaseLogger
}
