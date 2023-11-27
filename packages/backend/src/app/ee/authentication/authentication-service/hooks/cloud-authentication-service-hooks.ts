import {
    defaultAuthenticationServiceHooks,
} from '../../../../authentication/authentication-service/hooks/default-authentication-service-hooks'
import {
    AuthenticationServiceHooks,
} from '../../../../authentication/authentication-service/hooks/authentication-service-hooks'
import { PrincipalType, Project, User, isNil } from '@activepieces/shared'
import { platformService } from '../../../platform/platform.service'
import { accessTokenManager } from '../../../../authentication/lib/access-token-manager'
import { OtpType, Platform, PlatformId } from '@activepieces/ee-shared'
import { otpService } from '../../../otp/otp-service'
import { referralService } from '../../../referrals/referral.service'

export const cloudAuthenticationServiceHooks: AuthenticationServiceHooks = {
    async postSignUp({ user, referringUserId }) {
        const { user: updatedUser, project, token } = await defaultAuthenticationServiceHooks.postSignUp({
            user,
        })

        await otpService.createAndSend({
            platformId: user.platformId,
            email: user.email,
            type: OtpType.EMAIL_VERIFICATION,
        })

        const updatedToken = await populateTokenWithPlatformInfo({
            user,
            project,
            token,
        })

        if (referringUserId) {
            await referralService.upsert({
                referringUserId,
                referredUserId: user.id,
            })
        }

        return {
            user: updatedUser,
            project,
            token: updatedToken,
        }
    },

    async postSignIn({ user }) {
        const { user: updatedUser, project, token } = await defaultAuthenticationServiceHooks.postSignIn({
            user,
        })

        const updatedToken = await populateTokenWithPlatformInfo({
            user,
            project,
            token,
        })

        return {
            user: updatedUser,
            project,
            token: updatedToken,
        }
    },
}

const populateTokenWithPlatformInfo = async ({ user, project, token }: PopulateTokenWithPlatformInfoParams): Promise<string> => {
    const platform = await getPlatform(user.platformId)

    if (isNil(platform)) {
        return token
    }

    const updatedToken = await accessTokenManager.generateToken({
        id: user.id,
        type: PrincipalType.USER,
        projectId: project.id,
        projectType: project.type,
        platform: {
            id: platform.id,
            role: platform.ownerId === user.id ? 'OWNER' : 'MEMBER',
        },
    })

    return updatedToken
}

const getPlatform = async (platformId: PlatformId | null): Promise<Platform | null> => {
    if (isNil(platformId)) {
        return null
    }

    return platformService.getOne(platformId)
}

type PopulateTokenWithPlatformInfoParams = {
    user: User
    project: Project
    token: string
}
