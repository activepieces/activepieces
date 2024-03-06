import { AuthenticationServiceHooks } from '../../../../authentication/authentication-service/hooks/authentication-service-hooks'
import { OtpType } from '@activepieces/ee-shared'
import { otpService } from '../../../otp/otp-service'
import { referralService } from '../../../referrals/referral.service'
import { authenticationHelper } from './authentication-helper'
import { projectService } from '../../../../project/project-service'
import { userService } from '../../../../user/user-service'
import { isNil } from '@activepieces/shared'
import { flagService } from '../../../../../app/flags/flag.service'
import { appsumoService } from '../../../billing/appsumo/appsumo.service'
import { exceptionHandler, logger } from 'server-shared'

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
        const updatedUser = await userService.getOneOrFail({ id: user.id })
        const { project, token, projectRole } = await authenticationHelper.getProjectAndTokenOrThrow(user)

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
            projectRole,
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
