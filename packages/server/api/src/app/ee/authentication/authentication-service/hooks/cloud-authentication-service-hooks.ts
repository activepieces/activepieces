import { OtpType } from '@activepieces/ee-shared'
import { exceptionHandler, logger } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import { flagService } from '../../../../../app/flags/flag.service'
import { AuthenticationServiceHooks } from '../../../../authentication/authentication-service/hooks/authentication-service-hooks'
import { projectService } from '../../../../project/project-service'
import { userService } from '../../../../user/user-service'
import { userInvitationsService } from '../../../../user-invitations/user-invitation.service'
import { appsumoService } from '../../../billing/appsumo/appsumo.service'
import { otpService } from '../../../otp/otp-service'
import { referralService } from '../../../referrals/referral.service'
import { authenticationHelper } from './authentication-helper'

export const cloudAuthenticationServiceHooks: AuthenticationServiceHooks = {
    async preSignIn({ email, platformId, provider }) {
        await authenticationHelper.assertEmailAuthIsEnabled({
            platformId,
            provider,
        })
        await authenticationHelper.assertDomainIsAllowed({ email, platformId })
    },
    async preSignUp({ email, platformId, provider }) {
        await authenticationHelper.assertEmailAuthIsEnabled({
            platformId,
            provider,
        })
        await authenticationHelper.assertUserIsInvitedAndDomainIsAllowed({
            email,
            platformId,
        })
    },
    async postSignUp({ user, referringUserId }) {
        if (
            !isNil(user.platformId) &&
            flagService.isCloudPlatform(user.platformId)
        ) {
            await projectService.create({
                displayName: `${user.firstName}'s Project`,
                ownerId: user.id,
                platformId: user.platformId,
            })
        }

        if (referringUserId) {
            try {
                await referralService.add({
                    referringUserId,
                    referredUserId: user.id,
                    referredUserEmail: user.email,
                })
            }
            catch (e) {
                exceptionHandler.handle(e)
                logger.error(e, '[CloudAuthenticationServiceHooks#postSignUp] referralService.add')
            }
        }

        await authenticationHelper.autoVerifyUserIfEligible(user)
        await userInvitationsService.provisionUserInvitation({
            email: user.email,
            platformId: user.platformId!,
        })

        const updatedUser = await userService.getOneOrFail({ id: user.id })
        const { project, token } = await authenticationHelper.getProjectAndTokenOrThrow(user)

        if (!updatedUser.verified) {
            await otpService.createAndSend({
                platformId: updatedUser.platformId!,
                email: updatedUser.email,
                type: OtpType.EMAIL_VERIFICATION,
            })
        }
        const appSumo = await appsumoService.getByEmail(updatedUser.email)
        if (appSumo) {
            await appsumoService.handleRequest({
                plan_id: appSumo.plan_id,
                action: 'activate',
                uuid: appSumo.uuid,
                activation_email: appSumo.activation_email,
            })
        }
        return {
            user: updatedUser,
            project,
            token,
        }
    },

    async postSignIn({ user }) {
        const result = await authenticationHelper.getProjectAndTokenOrThrow(user)

        return {
            user,
            ...result,
        }
    },
}
