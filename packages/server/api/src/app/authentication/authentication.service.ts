import { OtpType } from '@activepieces/ee-shared'
import { ApEdition, ApFlagId, assertNotNullOrUndefined, AuthenticationResponse, isNil, PlatformRole, UserIdentityProvider } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { otpService } from '../ee/otp/otp-service'
import { flagService } from '../flags/flag.service'
import { system } from '../helper/system/system'
import { platformService } from '../platform/platform.service'
import { projectService } from '../project/project-service'
import { userService } from '../user/user-service'
import { userInvitationsService } from '../user-invitations/user-invitation.service'
import { authenticationUtils } from './authentication-utils'
import { userIdentityService } from './user-identity/user-identity-service'

export type AuthenticationService = {
    signUp(params: SignUpParams): Promise<AuthenticationResponse>
    signInWithPassword(params: SignInWithPasswordParams): Promise<AuthenticationResponse>
    federatedAuthn(params: FederatedAuthnParams): Promise<AuthenticationResponse>
}

type FederatedAuthnParams = {
    email: string
    firstName: string
    lastName: string
    newsLetter: boolean
    trackEvents: boolean
    provider: UserIdentityProvider
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
}

type SignInWithPasswordParams = {
    email: string
    password: string
    platformId: string | null
}

export const authenticationService = (log: FastifyBaseLogger): AuthenticationService => ({
    async signUp(params: SignUpParams): Promise<AuthenticationResponse> {
        if (!isNil(params.platformId)) {
            await authenticationUtils.assertEmailAuthIsEnabled({
                platformId: params.platformId,
                provider: params.provider,
            })
            await authenticationUtils.assertDomainIsAllowed({
                email: params.email,
                platformId: params.platformId,
            })
        }

        if (isNil(params.platformId) || flagService.isCloudPlatform(params.platformId)) {
            const userIdentity = await userIdentityService(log).create(params)

            const user = await userService.create({
                identityId: userIdentity.id,
                platformRole: PlatformRole.ADMIN,
                platformId: null,
            })
            const platform = await platformService.create({
                ownerId: user.id,
                name: 'Platform',
            })
            await userService.addOwnerToPlatform({
                platformId: platform.id,
                id: user.id,
            })
            const defaultProject = await projectService.create({
                displayName: 'Default Project',
                ownerId: user.id,
                platformId: platform.id,
            })

            const cloudEdition = system.getEdition()
            switch (cloudEdition) {
                case ApEdition.CLOUD:
                    await otpService(log).createAndSend({
                        platformId: platform.id,
                        email: params.email,
                        type: OtpType.EMAIL_VERIFICATION,
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
                user: user,
                project: defaultProject,
                log,
            })
            await authenticationUtils.saveNewsLetterSubscriber(user, userIdentity, log)

            return authenticationUtils.getProjectAndToken(user.id)
        }

        await authenticationUtils.assertUserIsInvitedToPlatformOrProject(log, {
            email: params.email,
            platformId: params.platformId,
        })
        const userIdentity = await userIdentityService(log).create(params)
        await userIdentityService(log).verify(userIdentity.id)
        const user = await userService.create({
            identityId: userIdentity.id,
            platformRole: PlatformRole.MEMBER,
            platformId: params.platformId,
        })
        await userInvitationsService(log).provisionUserInvitation({
            email: params.email,
            platformId: params.platformId,
        })

        return authenticationUtils.getProjectAndToken(user.id)
    },
    async signInWithPassword(params: SignInWithPasswordParams): Promise<AuthenticationResponse> {
        const identity = await userIdentityService(log).verifyIdenityPassword(params)
        assertNotNullOrUndefined(params.platformId, 'Platform ID is required')
        await authenticationUtils.assertEmailAuthIsEnabled({
            platformId: params.platformId,
            provider: UserIdentityProvider.EMAIL,
        })
        await authenticationUtils.assertDomainIsAllowed({
            email: params.email,
            platformId: params.platformId,
        })
        if (!flagService.isCloudPlatform(params.platformId) || isNil(params.platformId)) {
            const user = await userService.getOneByIdentityIdOnly({
                identityId: identity.id,
            })
            assertNotNullOrUndefined(user, 'User not found')
            return authenticationUtils.getProjectAndToken(user.id)
        }
        const user = await userService.getOneByIdentityAndPlatform({
            identityId: identity.id,
            platformId: params.platformId,
        })
        assertNotNullOrUndefined(user, 'User not found')
        return authenticationUtils.getProjectAndToken(user.id)
    },
    async federatedAuthn(params: FederatedAuthnParams): Promise<AuthenticationResponse> {
        const identity = await userIdentityService(log).verifyFederatedAuthn(params)
        const oldestPlatform = await platformService.getOldestPlatform()
        assertNotNullOrUndefined(oldestPlatform, 'Oldest platform not found')
        const user = await userService.getOneByIdentityAndPlatform({
            identityId: identity.id,
            platformId: oldestPlatform.id,
        })
        assertNotNullOrUndefined(user, 'User not found')
        return authenticationUtils.getProjectAndToken(user.id)
    },
})

