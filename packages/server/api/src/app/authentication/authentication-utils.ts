import { AppSystemProp } from '@activepieces/server-shared'
import { ActivepiecesError, ApEdition, ApEnvironment, AuthenticationResponse, ErrorCode, isNil, Principal, PrincipalType, Project, TelemetryEventName, User, UserIdentity, UserIdentityProvider, UserStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../helper/system/system'
import { telemetry } from '../helper/telemetry.utils'
import { platformService } from '../platform/platform.service'
import { projectService } from '../project/project-service'
import { userService } from '../user/user-service'
import { userInvitationsService } from '../user-invitations/user-invitation.service'
import { accessTokenManager } from './lib/access-token-manager'
import { userIdentityService } from './user-identity/user-identity-service'

const isTesting = system.getOrThrow(AppSystemProp.ENVIRONMENT) === ApEnvironment.TESTING

export const authenticationUtils = {
    async assertUserIsInvitedToPlatformOrProject(log: FastifyBaseLogger, {
        email,
        platformId,
    }: AssertUserIsInvitedToPlatformOrProjectParams): Promise<void> {
        if (isTesting) {
            return
        }
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
        const user = await userService.getOneOrFail({ id: params.userId })
        const projects = await projectService.getAllForUser({
            platformId: params.platformId,
            userId: params.userId,
        })
        let project = isNil(params.projectId) ? projects?.[0] : projects.find((project) => project.id === params.projectId)
        if (isNil(project)) {
            if (isTesting) {
                const newProject = await projectService.create({
                    displayName: user.id + '\'s Project',
                    ownerId: user.id,
                    platformId: params.platformId,
                })
                project = newProject
            }
            else {
                throw new ActivepiecesError({
                    code: ErrorCode.INVITATION_ONLY_SIGN_UP,
                    params: {
                        message: 'No project found for user',
                    },
                })
            }
        }
        const identity = await userIdentityService(system.globalLogger()).getOneOrFail({ id: user.identityId })
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
        const token = await accessTokenManager.generateToken({
            id: user.id,
            type: PrincipalType.USER,
            projectId: project.id,
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
        const platform = await platformService.getOneWithPlanOrThrow(platformId)
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
        const platform = await platformService.getOneWithPlanOrThrow(platformId)
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
        log,
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
            log.warn({ name: 'AuthenticationService#sendTelemetry', error: e })
        }
    },

    async saveNewsLetterSubscriber(user: User, platformId: string, identity: UserIdentity, log: FastifyBaseLogger): Promise<void> {
        const platform = await platformService.getOneWithPlanOrThrow(platformId)
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
            return await response.json()
        }
        catch (error) {
            log.warn(error)
        }
    },
    async extractUserIdFromPrincipal(
        principal: Principal,
    ): Promise<string> {
        if (principal.type === PrincipalType.USER) {
            return principal.id
        }
        // TODO currently it's same as api service, but it's better to get it from api key service, in case we introduced more admin users
        const project = await projectService.getOneOrThrow(principal.projectId)
        return project.ownerId
    },
}

type SendTelemetryParams = {
    identity: UserIdentity
    user: User
    project: Project
    log: FastifyBaseLogger
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
}