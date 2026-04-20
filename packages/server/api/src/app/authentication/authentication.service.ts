import { ActivepiecesError, ApEdition, ApFlagId, assertNotNullOrUndefined, AuthenticationResponse, ErrorCode, isNil, MfaChallengeResponse, PlatformRole, PlatformWithoutSensitiveData, ProjectType, User, UserIdentity, UserIdentityProvider } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { databaseConnection } from '../database/database-connection'
import { flagService } from '../flags/flag.service'
import { system } from '../helper/system/system'
import { platformService } from '../platform/platform.service'
import { platformUtils } from '../platform/platform.utils'
import { projectService } from '../project/project-service'
import { userService } from '../user/user-service'
import { userInvitationsService } from '../user-invitations/user-invitation.service'
import { authenticationUtils } from './authentication-utils'
import { userIdentityService } from './user-identity/user-identity-service'

export const authenticationService = (log: FastifyBaseLogger) => ({
    async signUp(params: SignUpParams): Promise<{ result: AuthenticationResponse | MfaChallengeResponse, responseHeaders: Headers | null }> {

        if (isNil(params.platformId)) {
            const userIdentity = await userIdentityService(log).create(params)
            if (params.provider !== UserIdentityProvider.EMAIL) {
                await userIdentityService(log).verify(userIdentity.id)
            }
            const authResponse = await createUserAndPlatform(userIdentity, log)
            return { result: authResponse, responseHeaders: null }
        }

        await assertCanSignup(log, {
            platformId: params.platformId,
            provider: params.provider,
            email: params.email,
        })

        const userIdentity = await userIdentityService(log).create({ ...params, emailVerified: true })
        const user = await userService(log).getOrCreateWithProject({
            identity: userIdentity,
            platformId: params.platformId,
        })
        await userInvitationsService(log).provisionUserInvitation({
            email: params.email,
            user,
        })

        log.info({ email: params.email, platformId: params.platformId }, 'User signed up to existing platform')

        // Always offer 2FA setup after joining an existing platform.
        // Get a better-auth session cookie so the setup page can call authClient.twoFactor.enable().
        const { responseHeaders } = await userIdentityService(log).verifyIdentityPassword({
            email: params.email,
            password: params.password,
        })
        const platform = await platformService(log).getOneOrThrow(params.platformId)
        return {
            result: { mfaRequired: true as const, setupRequired: true, enforced: platform.enforceTotp },
            responseHeaders,
        }
    },
    async signInWithPassword(params: SignInWithPasswordParams): Promise<{ result: AuthenticationResponse | MfaChallengeResponse, responseHeaders: Headers | null }> {
        const { identity, responseHeaders, twoFactorRedirect } = await userIdentityService(log).verifyIdentityPassword(params)
        const platformId = isNil(params.predefinedPlatformId) ? await getPersonalPlatformIdForIdentity(identity.id, log) : params.predefinedPlatformId
        if (isNil(platformId)) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHENTICATION,
                params: {
                    message: 'No platform found for identity',
                },
            })
        }
        await authenticationUtils(log).assertEmailAuthIsEnabled({
            platformId,
            provider: UserIdentityProvider.EMAIL,
        })
        await authenticationUtils(log).assertDomainIsAllowed({
            email: params.email,
            platformId,
        })

        if (twoFactorRedirect) {
            return { result: { mfaRequired: true as const }, responseHeaders }
        }

        const platform = await platformService(log).getOneOrThrow(platformId)
        if (platform.enforceTotp && !identity.twoFactorEnabled) {
            return { result: { mfaRequired: true as const, setupRequired: true }, responseHeaders }
        }

        const user = await userService(log).getOneByIdentityAndPlatform({
            identityId: identity.id,
            platformId,
        })
        assertNotNullOrUndefined(user, 'User not found')
        log.info({ email: params.email, platformId }, 'User signed in with password')
        const authResponse = await authenticationUtils(log).getProjectAndToken({
            userId: user.id,
            platformId,
            projectId: null,
        })
        return { result: authResponse, responseHeaders }
    },
    async exchangeSession(params: ExchangeSessionParams): Promise<AuthenticationResponse | MfaChallengeResponse> {
        const platformId = isNil(params.predefinedPlatformId) ? await getPersonalPlatformIdForIdentity(params.identityId, log) : params.predefinedPlatformId
        if (isNil(platformId)) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHENTICATION,
                params: {
                    message: 'No platform found for identity',
                },
            })
        }
        const identity = await userIdentityService(log).getOneOrFail({ id: params.identityId })
        const platform = await platformService(log).getOneOrThrow(platformId)
        if (platform.enforceTotp && !identity.twoFactorEnabled) {
            return { mfaRequired: true as const, setupRequired: true }
        }
        const user = await userService(log).getOneByIdentityAndPlatform({
            identityId: params.identityId,
            platformId,
        })
        assertNotNullOrUndefined(user, 'User not found')
        return authenticationUtils(log).getProjectAndToken({
            userId: user.id,
            platformId,
            projectId: null,
        })
    },
    async get2faStatus(params: Get2faStatusParams): Promise<{ enabled: boolean, backupCodesRemaining: number, hasPassword: boolean }> {
        const user = await userService(log).getOneOrFail({ id: params.userId })
        const identity = await userIdentityService(log).getOneOrFail({ id: user.identityId })
        const backupCodesRemaining = await countRemainingBackupCodes(identity.id)
        return {
            enabled: identity.twoFactorEnabled ?? false,
            backupCodesRemaining,
            hasPassword: identity.provider === UserIdentityProvider.EMAIL,
        }
    },
    async socialSignIn(params: FederatedAuthnParams): Promise<AuthenticationResponse | MfaChallengeResponse> {
        const platformId = isNil(params.predefinedPlatformId) ? await getPersonalPlatformIdForIdentity(params.identityId, log) : params.predefinedPlatformId
        const userIdentity = await userIdentityService(log).getOneOrFail({ id: params.identityId })
        if (isNil(platformId)) {
            return createUserAndPlatform(userIdentity, log)
        }

        const existingUser = await userService(log).getOneByIdentityAndPlatform({ identityId: params.identityId, platformId })
        if (existingUser) {
            await assertCanSignup(log, {
                platformId,
                provider: userIdentity.provider,
                email: userIdentity.email,
            })
        }

        const user = await userService(log).getOrCreateWithProject({
            identity: userIdentity,
            platformId,
        })
        await userInvitationsService(log).provisionUserInvitation({
            email: userIdentity.email,
            user,
        })

        // If user has 2FA enabled, redirect to verify flow.
        if (userIdentity.twoFactorEnabled) {
            return { mfaRequired: true as const }
        }

        const platform = await platformService(log).getOneOrThrow(platformId)
        if (platform.enforceTotp) {
            return { mfaRequired: true as const, setupRequired: true, enforced: true }
        }

        return authenticationUtils(log).getProjectAndToken({
            userId: user.id,
            platformId,
            projectId: null,
        })
    },
    async switchPlatform(params: SwitchPlatformParams): Promise<AuthenticationResponse> {
        const platforms = await platformService(log).listPlatformsForIdentityWithAtleastProject({ identityId: params.identityId })
        const platform = platforms.find((platform) => platform.id === params.platformId)
        await assertUserCanSwitchToPlatform(null, platform)

        assertNotNullOrUndefined(platform, 'Platform not found')
        const user = await getUserForPlatform(params.identityId, platform, log)
        log.info({ userId: user.id, platformId: platform.id }, 'User switched platform')
        return authenticationUtils(log).getProjectAndToken({
            userId: user.id,
            platformId: platform.id,
            projectId: null,
        })
    },
})

async function assertUserCanSwitchToPlatform(currentPlatformId: string | null, platform: PlatformWithoutSensitiveData | undefined): Promise<void> {
    if (isNil(platform)) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'The user is not a member of the platform',
            },
        })
    }
    const samePlatform = currentPlatformId === platform.id
    const allowToSwitch = !platformUtils.isCustomerOnDedicatedDomain(platform) || samePlatform
    if (!allowToSwitch) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHENTICATION,
            params: {
                message: 'The user is not a member of the platform',
            },
        })
    }
}

async function getUserForPlatform(identityId: string, platform: PlatformWithoutSensitiveData, log: FastifyBaseLogger): Promise<User> {
    const user = await userService(log).getOneByIdentityAndPlatform({
        identityId,
        platformId: platform.id,
    })
    if (isNil(user)) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'User is not member of the platform',
            },
        })
    }
    return user
}

async function createUserAndPlatform(userIdentity: UserIdentity, log: FastifyBaseLogger): Promise<AuthenticationResponse> {
    const user = await userService(log).create({
        identityId: userIdentity.id,
        platformRole: PlatformRole.ADMIN,
        platformId: null,
    })
    const platform = await platformService(log).create({
        ownerId: user.id,
        name: userIdentity.firstName + '\'s Platform',
    })
    await userService(log).addOwnerToPlatform({
        platformId: platform.id,
        id: user.id,
    })
    const defaultProject = await projectService(log).create({
        displayName: userIdentity.firstName + '\'s Project',
        ownerId: user.id,
        platformId: platform.id,
        type: ProjectType.PERSONAL,
    })

    const cloudEdition = system.getEdition()

    switch (cloudEdition) {
        case ApEdition.CLOUD:
            await userIdentityService(log).sendVerifyEmail({
                email: userIdentity.email,
                platformId: platform.id,
            })
            break
        case ApEdition.COMMUNITY:
        case ApEdition.ENTERPRISE:
            await userIdentityService(log).verify(userIdentity.id)
            break
    }

    await flagService(log).save({
        id: ApFlagId.USER_CREATED,
        value: true,
    })
    await authenticationUtils(log).sendTelemetry({
        identity: userIdentity,
        user,
        project: defaultProject,
    })
    await authenticationUtils(log).saveNewsLetterSubscriber(user, platform.id, userIdentity)

    return authenticationUtils(log).getProjectAndToken({
        userId: user.id,
        platformId: platform.id,
        projectId: defaultProject.id,
    })
}

async function getPersonalPlatformIdForIdentity(identityId: string, log: FastifyBaseLogger): Promise<string | null> {
    const edition = system.getEdition()
    if (edition === ApEdition.CLOUD) {
        const platforms = await platformService(log).listPlatformsForIdentityWithAtleastProject({ identityId })
        const platform = platforms.find((platform) => !platformUtils.isCustomerOnDedicatedDomain(platform))
        return platform?.id ?? null
    }
    return null
}

async function countRemainingBackupCodes(identityId: string): Promise<number> {
    const rows = await databaseConnection().query(
        'SELECT "backupCodes" FROM "twoFactor" WHERE "userId" = $1 LIMIT 1',
        [identityId],
    ) as Array<{ backupCodes: string | null }>
    if (!rows.length || !rows[0].backupCodes) {
        return 0
    }
    try {
        const codes = JSON.parse(rows[0].backupCodes) as unknown[]
        return Array.isArray(codes) ? codes.length : 0
    }
    catch {
        return 0
    }
}

async function assertCanSignup(log: FastifyBaseLogger, params: AssertSignupParams): Promise<void> {
    await authenticationUtils(log).assertEmailAuthIsEnabled({
        platformId: params.platformId,
        provider: params.provider,
    })
    await authenticationUtils(log).assertDomainIsAllowed({
        email: params.email,
        platformId: params.platformId,
    })

    await authenticationUtils(log).assertUserIsInvitedToPlatformOrProject({
        email: params.email,
        platformId: params.platformId,
    })
}


type FederatedAuthnParams = {
    predefinedPlatformId?: string
    identityId: string
}

type SignUpParams = {
    email: string
    firstName: string
    lastName: string
    platformId: string | null
    trackEvents: boolean
    newsLetter: boolean
    provider: UserIdentityProvider.EMAIL | UserIdentityProvider.JWT
    password: string
    imageUrl?: string
}

type SignInWithPasswordParams = {
    email: string
    password: string
    predefinedPlatformId: string | null
}

type SwitchPlatformParams = {
    identityId: string
    platformId: string
}

type AssertSignupParams = {
    email: string
    platformId: string
    provider: UserIdentityProvider
}

type ExchangeSessionParams = {
    identityId: string
    predefinedPlatformId: string | null
}

type Get2faStatusParams = {
    userId: string
}
