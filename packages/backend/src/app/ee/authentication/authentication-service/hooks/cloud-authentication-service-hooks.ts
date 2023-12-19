import {
    AuthenticationServiceHooks,
} from '../../../../authentication/authentication-service/hooks/authentication-service-hooks'
import { OtpType } from '@activepieces/ee-shared'
import { otpService } from '../../../otp/otp-service'
import { referralService } from '../../../referrals/referral.service'
import { authenticationHelper } from './authentication-helper'
import { projectService } from '../../../../project/project-service'
import { userService } from '../../../../user/user-service'
import { ProjectType, UserStatus, isNil } from '@activepieces/shared'

export const cloudAuthenticationServiceHooks: AuthenticationServiceHooks = {
    async preSignUp({ email, platformId }) {
        if (!isNil(platformId)) {
            await authenticationHelper.assertUserIsInvitedToAnyProject({ email, platformId })            
        }
    },
    async postSignUp({ user, referringUserId }) {

        if (isNil(user.platformId)) {
            await projectService.create({
                displayName: `${user.firstName}'s Project`,
                ownerId: user.id,
                platformId: undefined,
                type: ProjectType.STANDALONE,
            })
        }
        if (referringUserId) {
            await referralService.upsert({
                referringUserId,
                referredUserId: user.id,
            })
        }

        await authenticationHelper.autoVerifyUserIfEligible(user)
        const updatedUser = await userService.getOneOrFail({ id: user.id })
        const { project, token } = await authenticationHelper.getProjectAndTokenOrThrow(user)

        if (updatedUser.status !== UserStatus.VERIFIED) {
            await otpService.createAndSend({
                platformId: updatedUser.platformId,
                email: updatedUser.email,
                type: OtpType.EMAIL_VERIFICATION,
            })
        }
        return {
            user: updatedUser,
            project,
            token,
        }
    },

    async postSignIn({ user }) {
        const { project, token } = await authenticationHelper.getProjectAndTokenOrThrow(user)
        return {
            user,
            project,
            token,
        }
    },
}

