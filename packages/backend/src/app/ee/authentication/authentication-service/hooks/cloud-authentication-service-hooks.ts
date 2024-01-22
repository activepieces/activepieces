import {
    AuthenticationServiceHooks,
} from '../../../../authentication/authentication-service/hooks/authentication-service-hooks'
import { OtpType } from '@activepieces/ee-shared'
import { otpService } from '../../../otp/otp-service'
import { referralService } from '../../../referrals/referral.service'
import { authenticationHelper } from './authentication-helper'
import { projectService } from '../../../../project/project-service'
import { userService } from '../../../../user/user-service'
import { assertNotNullOrUndefined, isNil } from '@activepieces/shared'
import { flagService } from '../../../../../app/flags/flag.service'

export const cloudAuthenticationServiceHooks: AuthenticationServiceHooks = {
    async preSignIn({ email, platformId }) {
        await authenticationHelper.assertEmailAuthIsEnabled({ platformId })
        await authenticationHelper.assertDomainIsAllowed({ email, platformId })
    },
    async preSignUp({ email, platformId }) {
        await authenticationHelper.assertEmailAuthIsEnabled({ platformId })
        await authenticationHelper.assertUserIsInvitedAndDomainIsAllowed({ email, platformId })
    },
    async postSignUp({ user, referringUserId }) {

        if (!isNil(user.platformId) && flagService.isCloudPlatform(user.platformId)) {
            await projectService.create({
                displayName: `${user.firstName}'s Project`,
                ownerId: user.id,
                platformId: user.platformId,
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

        assertNotNullOrUndefined(updatedUser.platformId, 'platformId')
        if (!updatedUser.verified) {
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

