import { ActivepiecesError, ApEdition, ApEnvironment, assertNotNullOrUndefined, AuthenticationResponse, EndpointScope, ErrorCode, isNil, PrincipalType, Project, ProjectType, TelemetryEventName, User, UserIdentity, UserIdentityProvider, UserStatus } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyRequest } from 'fastify'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { telemetry } from '../helper/telemetry.utils'
import { platformService } from '../platform/platform.service'
import { projectService } from '../project/project-service'
import { userService } from '../user/user-service'
import { userInvitationsService } from '../user-invitations/user-invitation.service'
import { accessTokenManager } from './lib/access-token-manager'
import { userIdentityService } from './user-identity/user-identity-service'

export const authenticationUtils = (log: FastifyBaseLogger) => ({
    async assertUserIsInvitedToPlatformOrProject({
        email,
        platformId,
    }: AssertUserIsInvitedToPlatformOrProjectParams): Promise<void> {
        const isInvited = await userInvitationsService(log).hasAnyAcceptedInvitations({
            platformId,
            email,
            
        })
        if (!isInvited) {
            throw new ActivepiecesError({
                code: ErrorCode.INVITATION_ONLY_SIGN_UP,
                params: {
                    message: 'User is not invited to the platform',
                },
            })
        }
    },

    async getProjectAndToken(params: GetProjectAndTokenParams): Promise<AuthenticationResponse> {
        const user = await userService(log).getOneOrFail({ id: params.userId })
        const projects = await projectService(log).getAllForUser({
            platformId: params.platformId,
            userId: params.userId,
            isPrivileged: userService(log).isUserPrivileged(user),
        })
        const project = isNil(params.projectId)
            ? findPersonalProject(projects, params.userId) ?? projects?.[0]
            : projects.find((project) => project.id === params.projectId)
        if (isNil(project)) {
            throw new ActivepiecesError({
                code: ErrorCode.INVITATION_ONLY_SIGN_UP,
                params: {
                    message: 'No project found for user',
                },
            })
        }
        const identity = await userIdentityService(log).getOneOrFail({ id: user.identityId })
        if (!identity.verified) {
            throw new ActivepiecesError({
                code: ErrorCode.EMAIL_IS_NOT_VERIFIED,
                params: {
                    email: identity.email,
                },
            })
        }
        if (user.status === UserStatus.INACTIVE) {
            throw new ActivepiecesError({
                code: ErrorCode.USER_IS_INACTIVE,
                params: {
                    email: identity.email,
                },
            })
        }
        const token = await accessTokenManager(log).generateToken({
            id: user.id,
            type: PrincipalType.USER,
            platform: {
                id: params.platformId,
            },
            tokenVersion: identity.tokenVersion,
        })
        return {
            ...user,
            firstName: identity.firstName,
            lastName: identity.lastName,
            email: identity.email,
            trackEvents: identity.trackEvents,
            newsLetter: identity.newsLetter,
            verified: identity.verified,
            token,
            projectId: project.id,
        }
    },

    async assertDomainIsAllowed({
        email,
        platformId,
    }: AssertDomainIsAllowedParams): Promise<void> {
        const edition = system.getEdition()
        if (edition === ApEdition.COMMUNITY) {
            return
        }
        const platform = await platformService(log).getOneWithPlanOrThrow(platformId)
        if (!platform.plan.ssoEnabled) {
            return
        }
        const emailDomain = email.split('@')[1]
        const isAllowedDomaiin =
            !platform.enforceAllowedAuthDomains ||
            platform.allowedAuthDomains.includes(emailDomain)

        if (!isAllowedDomaiin) {
            throw new ActivepiecesError({
                code: ErrorCode.DOMAIN_NOT_ALLOWED,
                params: {
                    domain: emailDomain,
                },
            })
        }
    },

    async assertEmailAuthIsEnabled({
        platformId,
        provider,
    }: AssertEmailAuthIsEnabledParams): Promise<void> {
        const edition = system.getEdition()
        if (edition === ApEdition.COMMUNITY) {
            return
        }
        const platform = await platformService(log).getOneWithPlanOrThrow(platformId)
        if (!platform.plan.ssoEnabled) {
            return
        }
        if (provider !== UserIdentityProvider.EMAIL) {
            return
        }
        if (!platform.emailAuthEnabled) {
            throw new ActivepiecesError({
                code: ErrorCode.EMAIL_AUTH_DISABLED,
                params: {},
            })
        }
    },

    async sendTelemetry({
        user,
        identity,
        project,
    }: SendTelemetryParams): Promise<void> {
        try {
            await telemetry(log).identify(user, identity, project.id)

            await telemetry(log).trackProject(project.id, {
                name: TelemetryEventName.SIGNED_UP,
                payload: {
                    userId: identity.id,
                    email: identity.email,
                    firstName: identity.firstName,
                    lastName: identity.lastName,
                    projectId: project.id,
                },
            })
        }
        catch (e) {
            log.warn({ err: e }, '[authenticationUtils#sendTelemetry] Failed to send telemetry')
        }
    },

    async saveNewsLetterSubscriber(user: User, platformId: string, identity: UserIdentity): Promise<void> {
        const platform = await platformService(log).getOneWithPlanOrThrow(platformId)
        const environment = system.get(AppSystemProp.ENVIRONMENT)
        if (environment !== ApEnvironment.PRODUCTION) {
            return
        }
        if (platform.plan.embeddingEnabled) {
            return
        }
        try {
            const response = await fetch(
                'https://us-central1-activepieces-b3803.cloudfunctions.net/addContact',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email: identity.email }),
                },
            )
            await response.json()
        }
        catch (error) {
            log.warn({ err: error }, '[authenticationUtils#saveNewsLetterSubscriber] Failed to save newsletter subscriber')
        }
    },
    async extractUserIdFromRequest(request: FastifyRequest): Promise<string> {
        if (request.principal.type === PrincipalType.USER) {
            return request.principal.id
        }
        // TODO currently it's same as api service, but it's better to get it from api key service, in case we introduced more admin users
        const projectId = request.principal.type === PrincipalType.ENGINE ? request.principal.projectId : request.projectId
        assertNotNullOrUndefined(projectId, 'projectId')
        const project = await projectService(log).getOneOrThrow(projectId)
        return project.ownerId
    },
})

function findPersonalProject(projects: Project[], userId: string): Project | undefined {
    return projects.find((project) => project.ownerId === userId && project.type === ProjectType.PERSONAL)
}

type SendTelemetryParams = {
    identity: UserIdentity
    user: User
    project: Project
}

type AssertDomainIsAllowedParams = {
    email: string
    platformId: string
}

type AssertEmailAuthIsEnabledParams = {
    platformId: string
    provider: UserIdentityProvider
}

type AssertUserIsInvitedToPlatformOrProjectParams = {
    email: string
    platformId: string
}

type GetProjectAndTokenParams = {
    userId: string
    platformId: string
    projectId: string | null
    scope?: EndpointScope
}