import { ActivepiecesError, ApEdition, ApFlagId, assertNotNullOrUndefined, AuthenticationResponse, ErrorCode, isNil, PlatformRole, PlatformWithoutSensitiveData, ProjectType, User, UserIdentity, UserIdentityProvider } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
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
    async signUp(params: SignUpParams): Promise<AuthenticationResponse> {
      
        if (isNil(params.platformId)) {
            const userIdentity = await userIdentityService(log).create(params)
            if (params.provider !== UserIdentityProvider.EMAIL) {
                await userIdentityService(log).verify(userIdentity.id)
            }
            return createUserAndPlatform(userIdentity, log)
        }

        await assertCanSignup(log, {
            platformId: params.platformId,
            provider: params.provider,
            email: params.email,
        })

        const userIdentity = await userIdentityService(log).create(params)
        const user = await userService.getOrCreateWithProject({
            identity: userIdentity,
            platformId: params.platformId,
        })
        await userInvitationsService(log).provisionUserInvitation({
            email: params.email,
            user,
        })

        return authenticationUtils.getProjectAndToken({
            userId: user.id,
            platformId: params.platformId,
            projectId: null,
        })
    },
    async signInWithPassword(params: SignInWithPasswordParams): Promise<AuthenticationResponse> {
        const identity = await userIdentityService(log).verifyIdentityPassword(params)
        const platformId = isNil(params.predefinedPlatformId) ? await getPersonalPlatformIdForIdentity(identity.id) : params.predefinedPlatformId
        if (isNil(platformId)) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHENTICATION,
                params: {
                    message: 'No platform found for identity',
                },
            })
        }
        await authenticationUtils.assertEmailAuthIsEnabled({
            platformId,
            provider: UserIdentityProvider.EMAIL,
        })
        await authenticationUtils.assertDomainIsAllowed({
            email: params.email,
            platformId,
        })
        const user = await userService.getOneByIdentityAndPlatform({
            identityId: identity.id,
            platformId,
        })
        assertNotNullOrUndefined(user, 'User not found')
        return authenticationUtils.getProjectAndToken({
            userId: user.id,
            platformId,
            projectId: null,
        })
    },
    async socialSignIn(params: FederatedAuthnParams): Promise<AuthenticationResponse> {
        const platformId = isNil(params.predefinedPlatformId) ? await getPersonalPlatformIdForIdentity(params.identityId) : params.predefinedPlatformId
        const userIdentity = await userIdentityService(log).getOneOrFail({ id: params.identityId })

        if (isNil(platformId)) {
            await userIdentityService(log).unDraft(params.identityId)
            return createUserAndPlatform(userIdentity, log)
        }

        if (userIdentity.draft) {
            await assertCanSignup(log, {
                platformId: platformId,
                provider: userIdentity.provider,
                email: userIdentity.email,
            })
            await userIdentityService(log).unDraft(params.identityId)
        }

        const user = await userService.getOrCreateWithProject({
            identity: userIdentity,
            platformId,
        })
        await userInvitationsService(log).provisionUserInvitation({
            email: userIdentity.email,
            user,
        })
        return authenticationUtils.getProjectAndToken({
            userId: user.id,
            platformId,
            projectId: null,
        })
    },
    async switchPlatform(params: SwitchPlatformParams): Promise<AuthenticationResponse> {
        const platforms = await platformService.listPlatformsForIdentityWithAtleastProject({ identityId: params.identityId })
        const platform = platforms.find((platform) => platform.id === params.platformId)
        await assertUserCanSwitchToPlatform(null, platform)

        assertNotNullOrUndefined(platform, 'Platform not found')
        const user = await getUserForPlatform(params.identityId, platform)
        return authenticationUtils.getProjectAndToken({
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

async function getUserForPlatform(identityId: string, platform: PlatformWithoutSensitiveData): Promise<User> {
    const user = await userService.getOneByIdentityAndPlatform({
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
    const user = await userService.create({
        identityId: userIdentity.id,
        platformRole: PlatformRole.ADMIN,
        platformId: null,
    })
    const platform = await platformService.create({
        ownerId: user.id,
        name: userIdentity.firstName + '\'s Platform',
    })
    await userService.addOwnerToPlatform({
        platformId: platform.id,
        id: user.id,
    })
    const defaultProject = await projectService.create({
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
                platformId: platform.id
            })
            break
        case ApEdition.COMMUNITY:
        case ApEdition.ENTERPRISE:
            await userIdentityService(log).verify(userIdentity.id)
            break
    }

    await flagService.save({
        id: ApFlagId.USER_CREATED,
        value: true,
    })
    await authenticationUtils.sendTelemetry({
        identity: userIdentity,
        user,
        project: defaultProject,
        log,
    })
    await authenticationUtils.saveNewsLetterSubscriber(user, platform.id, userIdentity, log)

    return authenticationUtils.getProjectAndToken({
        userId: user.id,
        platformId: platform.id,
        projectId: defaultProject.id,
    })
}

async function getPersonalPlatformIdForIdentity(identityId: string): Promise<string | null> {
    const edition = system.getEdition()
    if (edition === ApEdition.CLOUD) {
        const platforms = await platformService.listPlatformsForIdentityWithAtleastProject({ identityId })
        const platform = platforms.find((platform) => !platformUtils.isCustomerOnDedicatedDomain(platform))
        return platform?.id ?? null
    }
    return null
}

async function assertCanSignup(log: FastifyBaseLogger, params: AssertSignupParams): Promise<void> {
    await authenticationUtils.assertEmailAuthIsEnabled({
        platformId: params.platformId,
        provider: params.provider,
    })
    await authenticationUtils.assertDomainIsAllowed({
        email: params.email,
        platformId: params.platformId,
    })

    await authenticationUtils.assertUserIsInvitedToPlatformOrProject(log, {
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