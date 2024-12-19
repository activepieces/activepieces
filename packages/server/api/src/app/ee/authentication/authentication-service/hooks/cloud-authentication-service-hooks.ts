import { OtpType } from '@activepieces/ee-shared'
import { isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flagService } from '../../../../../app/flags/flag.service'
import { AuthenticationServiceHooks } from '../../../../authentication/authentication-service/hooks/authentication-service-hooks'
import { projectService } from '../../../../project/project-service'
import { userService } from '../../../../user/user-service'
import { userInvitationsService } from '../../../../user-invitations/user-invitation.service'
import { appsumoService } from '../../../billing/appsumo/appsumo.service'
import { otpService } from '../../../otp/otp-service'
import { authenticationHelper } from './authentication-helper'

export const cloudAuthenticationServiceHooks = (log: FastifyBaseLogger): AuthenticationServiceHooks => ({
    async preSignIn({ email, platformId, provider }) {
        await authenticationHelper(log).assertEmailAuthIsEnabled({
            platformId,
            provider,
        })
        await authenticationHelper(log).assertDomainIsAllowed({ email, platformId })
    },
    async preSignUp({ email, platformId, provider }) {
        await authenticationHelper(log).assertEmailAuthIsEnabled({
            platformId,
            provider,
        })
        await authenticationHelper(log).assertUserIsInvitedAndDomainIsAllowed({
            email,
            platformId,
        })
    },
    async postSignUp({ user }) {
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

   

        await authenticationHelper(log).autoVerifyUserIfEligible(user)
        await userInvitationsService(log).provisionUserInvitation({
            email: user.email,
            platformId: user.platformId!,
        })

        const updatedUser = await userService.getOneOrFail({ id: user.id })
        const { project, token } = await authenticationHelper(log).getProjectAndTokenOrThrow(user)

        if (!updatedUser.verified) {
            await otpService(log).createAndSend({
                platformId: updatedUser.platformId!,
                email: updatedUser.email,
                type: OtpType.EMAIL_VERIFICATION,
            })
        }
        const appSumo = await appsumoService(log).getByEmail(updatedUser.email)
        if (appSumo) {
            await appsumoService(log).handleRequest({
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
        const result = await authenticationHelper(log).getProjectAndTokenOrThrow(user)

        return {
            user,
            ...result,
        }
    },
})
