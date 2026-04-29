import { cryptoUtils } from '@activepieces/server-utils'
import { ActivepiecesError, ApEdition, ApFlagId, assertNotNullOrUndefined, AuthenticationResponse, ErrorCode, isNil, OtpType, PlatformWithoutSensitiveData, User, UserIdentity, UserIdentityProvider, UserStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { otpService } from '../ee/authentication/otp/otp-service'
import { flagService } from '../flags/flag.service'
import { system } from '../helper/system/system'
import { platformService } from '../platform/platform.service'
import { platformUtils } from '../platform/platform.utils'
import { userService } from '../user/user-service'
import { userInvitationsService } from '../user-invitations/user-invitation.service'
import { authenticationUtils } from './authentication-utils'
import { userIdentityService } from './user-identity/user-identity-service'

export const authenticationService = (log: FastifyBaseLogger) => ({
    async signUp(params: SignUpParams): Promise<AuthenticationResponse> {
        const platformId = params.platformId

        if (!isNil(platformId)) {
            await authenticationUtils(log).assertEmailAuthIsEnabled({
                platformId,
                provider: params.provider,
            })
            await authenticationUtils(log).assertDomainIsAllowed({
                email: params.email,
                platformId,
            })
            await authenticationUtils(log).assertUserIsInvitedToPlatformOrProject({
                email: params.email,
                platformId,
            })
            const userIdentity = await userIdentityService(log).create({
                ...params,
                verified: true,
            })
            const user = await userService(log).getOrCreateWithProject({
                identity: userIdentity,
                platformId,
            })
            await userInvitationsService(log).provisionUserInvitation({ email: params.email })

            log.info({ email: params.email, platformId }, 'User signed up to existing platform')
            return authenticationUtils(log).getProjectAndToken({
                userId: user.id,
                platformId,
                projectId: null,
            })
        }

        const hasInvitations = await userInvitationsService(log).hasAnyAcceptedInvitationsForEmail({ email: params.email })
        const isFederatedProvider = params.provider === UserIdentityProvider.GOOGLE || params.provider === UserIdentityProvider.JWT || params.provider === UserIdentityProvider.SAML
        const userIdentity = await userIdentityService(log).create({
            ...params,
            verified: hasInvitations || isFederatedProvider,
        })
        await sendVerificationOrAutoVerify(userIdentity, log)
        await flagService(log).save({ id: ApFlagId.USER_CREATED, value: true })
        await authenticationUtils(log).sendTelemetry({ identity: userIdentity })
        await authenticationUtils(log).saveNewsLetterSubscriber(userIdentity)
        await userInvitationsService(log).provisionUserInvitation({ email: params.email })

        const preferredPlatformId = await getPreferredPlatformId(userIdentity.id, log)
        if (!isNil(preferredPlatformId)) {
            const user = await userService(log).getOrCreateWithProject({
                identity: userIdentity,
                platformId: preferredPlatformId,
            })
            log.info({ email: params.email, provider: params.provider, preferredPlatformId }, 'User signed up with invitation, returning preferred platform token')
            return authenticationUtils(log).getProjectAndToken({
                userId: user.id,
                platformId: preferredPlatformId,
                projectId: null,
            })
        }
        log.info({ email: params.email, provider: params.provider }, 'User signed up without platform')
        return authenticationUtils(log).getOnboardingResponse({ identityId: userIdentity.id })

    },
    async signInWithPassword(params: SignInWithPasswordParams): Promise<AuthenticationResponse> {
        const identity = await userIdentityService(log).verifyIdentityPassword(params)
        const platformId = isNil(params.predefinedPlatformId) ? await getPreferredPlatformId(identity.id, log) : params.predefinedPlatformId

        if (isNil(platformId)) {
            const anyUser = await userService(log).getOneByIdentityIdOnly({ identityId: identity.id })
            if (!isNil(anyUser) && anyUser.status === UserStatus.INACTIVE) {
                throw new ActivepiecesError({
                    code: ErrorCode.USER_IS_INACTIVE,
                    params: { email: params.email },
                })
            }
            log.info({ email: params.email }, 'User signed in without platform, returning onboarding token')
            return authenticationUtils(log).getOnboardingResponse({ identityId: identity.id })
        }

        await authenticationUtils(log).assertEmailAuthIsEnabled({
            platformId,
            provider: UserIdentityProvider.EMAIL,
        })
        await authenticationUtils(log).assertDomainIsAllowed({
            email: params.email,
            platformId,
        })
        const user = await userService(log).getOneByIdentityAndPlatform({
            identityId: identity.id,
            platformId,
        })
        assertNotNullOrUndefined(user, 'User not found')
        log.info({ email: params.email, platformId }, 'User signed in with password')
        return authenticationUtils(log).getProjectAndToken({
            userId: user.id,
            platformId,
            projectId: null,
        })
    },
    async federatedAuthn(params: FederatedAuthnParams): Promise<AuthenticationResponse> {
        const platformId = isNil(params.predefinedPlatformId) ? await getPreferredPlatformIdForFederatedAuthn(params.email, log) : params.predefinedPlatformId
        const userIdentity = await userIdentityService(log).getIdentityByEmail(params.email)

        if (isNil(platformId)) {
            if (!isNil(userIdentity)) {
                const anyUser = await userService(log).getOneByIdentityIdOnly({ identityId: userIdentity.id })
                if (!isNil(anyUser) && anyUser.status === UserStatus.INACTIVE) {
                    throw new ActivepiecesError({
                        code: ErrorCode.USER_IS_INACTIVE,
                        params: { email: params.email },
                    })
                }
                return authenticationUtils(log).getOnboardingResponse({ identityId: userIdentity.id })
            }
            return authenticationService(log).signUp({
                email: params.email,
                firstName: params.firstName,
                lastName: params.lastName,
                newsLetter: params.newsLetter,
                trackEvents: params.trackEvents,
                provider: params.provider,
                platformId: null,
                password: await cryptoUtils.generateRandomPassword(),
                imageUrl: params.imageUrl,
            })
        }
        if (isNil(userIdentity)) {
            return authenticationService(log).signUp({
                email: params.email,
                firstName: params.firstName,
                lastName: params.lastName,
                newsLetter: params.newsLetter,
                trackEvents: params.trackEvents,
                provider: params.provider,
                platformId,
                password: await cryptoUtils.generateRandomPassword(),
                imageUrl: params.imageUrl,
            })
        }
        const user = await userService(log).getOrCreateWithProject({
            identity: userIdentity,
            platformId,
        })
        await userInvitationsService(log).provisionUserInvitation({ email: params.email })
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

async function sendVerificationOrAutoVerify(userIdentity: UserIdentity, log: FastifyBaseLogger): Promise<void> {
    const edition = system.getEdition()
    switch (edition) {
        case ApEdition.CLOUD:
            if (!userIdentity.verified) {
                await otpService(log).createAndSend({
                    platformId: null,
                    email: userIdentity.email,
                    type: OtpType.EMAIL_VERIFICATION,
                })
            }
            break
        case ApEdition.COMMUNITY:
        case ApEdition.ENTERPRISE:
            await userIdentityService(log).verify(userIdentity.id)
            break
    }
}

async function getPreferredPlatformIdForFederatedAuthn(email: string, log: FastifyBaseLogger): Promise<string | null> {
    const identity = await userIdentityService(log).getIdentityByEmail(email)
    if (isNil(identity)) {
        return null
    }
    return getPreferredPlatformId(identity.id, log)
}

async function getPreferredPlatformId(identityId: string, log: FastifyBaseLogger): Promise<string | null> {
    const edition = system.getEdition()
    if (edition === ApEdition.CLOUD) {
        const platforms = await platformService(log).listPlatformsForIdentityWithAtleastProject({ identityId })
        const nonDedicated = platforms.filter((p) => !platformUtils.isCustomerOnDedicatedDomain(p))
        const identity = await userIdentityService(log).getOneOrFail({ id: identityId })
        const lastUsed = !isNil(identity.lastLoggedInPlatformId) ? nonDedicated.find((p) => p.id === identity.lastLoggedInPlatformId) : undefined
        const licensed = nonDedicated.find((p) => !isNil(p.plan.licenseKey))
        return lastUsed?.id ?? licensed?.id ?? nonDedicated[0]?.id ?? null
    }
    return null
}



type FederatedAuthnParams = {
    email: string
    firstName: string
    lastName: string
    newsLetter: boolean
    trackEvents: boolean
    provider: UserIdentityProvider
    predefinedPlatformId: string | null
    imageUrl?: string
}

type SignUpParams = {
    email: string
    firstName: string
    lastName: string
    password: string
    platformId: string | null
    trackEvents: boolean
    newsLetter: boolean
    provider: UserIdentityProvider
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
