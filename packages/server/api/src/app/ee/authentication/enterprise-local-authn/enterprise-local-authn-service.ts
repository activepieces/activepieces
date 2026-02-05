import {
    ApplicationEvent,
    ApplicationEventName,
    OtpType,
    ResetPasswordRequestBody,
    VerifyEmailRequestBody,
} from '@activepieces/ee-shared'
import { ActivepiecesError, ErrorCode, isNil, UserId, UserIdentity } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { userIdentityService } from '../../../authentication/user-identity/user-identity-service'
import { applicationEvents } from '../../../helper/application-events'
import { userService } from '../../../user/user-service'
import { otpService } from '../otp/otp-service'

export const enterpriseLocalAuthnService = (log: FastifyBaseLogger) => ({
    async verifyEmail({ identityId, otp }: VerifyEmailRequestBody): Promise<UserIdentity> {
        const isOtpValid = await otpService(log).confirm({
            identityId,
            type: OtpType.EMAIL_VERIFICATION,
            value: otp,
        })

        if (!isOtpValid) {
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_OTP,
                params: {},
            })
        }

        await sendAuditLogForIdentity(identityId, {
            action: ApplicationEventName.USER_EMAIL_VERIFIED,
            data: {},
        }, log)

        return userIdentityService(log).verify(identityId)
    },

    async resetPassword({
        identityId,
        otp,
        newPassword,
    }: ResetPasswordRequestBody): Promise<void> {
        const isOtpValid = await otpService(log).confirm({
            identityId,
            type: OtpType.PASSWORD_RESET,
            value: otp,
        })

        if (!isOtpValid) {
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_OTP,
                params: {},
            })
        }

        await sendAuditLogForIdentity(identityId, {
            action: ApplicationEventName.USER_PASSWORD_RESET,
            data: {},
        }, log)

        await userIdentityService(log).updatePassword({
            id: identityId,
            newPassword,
        })
    },
})

const sendAuditLogForIdentity = async (
    identityId: UserId,
    event: Pick<ApplicationEvent, 'action' | 'data'>,
    log: FastifyBaseLogger,
): Promise<void> => {
    const users = await userService.getUsersByIdentityId({ identityId })
    for (const { id, platformId } of users) {
        if (isNil(platformId)) {
            continue
        }
        applicationEvents(log).sendUserEvent(
            {
                platformId,
                userId: id,
            },
            event as ApplicationEvent,
        )
    }
}