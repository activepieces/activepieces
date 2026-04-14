import {
    ApplicationEvent,
    ApplicationEventName,
    CreateOtpRequestBody,
    isNil,
    OtpType,
    ResetPasswordRequestBody,
    UserId,
    UserIdentity,
    VerifyEmailRequestBody,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { userIdentityService } from '../../../authentication/user-identity/user-identity-service'
import { applicationEvents } from '../../../helper/application-events'
import { userService } from '../../../user/user-service'

export const enterpriseLocalAuthnService = (log: FastifyBaseLogger) => ({
    async verifyEmail({ identityId, otp }: VerifyEmailRequestBody): Promise<UserIdentity> {
        const result = await userIdentityService(log).verifyEmail({ identityId, otp })

        await sendAuditLogForIdentity(identityId, {
            action: ApplicationEventName.USER_EMAIL_VERIFIED,
            data: {},
        }, log)

        return result
    },

    async resetPassword({
        identityId,
        otp,
        newPassword,
    }: ResetPasswordRequestBody): Promise<void> {
        await userIdentityService(log).resetPassword({
            identityId,
            otp,
            newPassword,
        })

        await sendAuditLogForIdentity(identityId, {
            action: ApplicationEventName.USER_PASSWORD_RESET,
            data: {},
        }, log)
    },

    async sendOTP({
        email,
        type,
    }: CreateOtpRequestBody): Promise<void> {
        switch (type) {
            case OtpType.EMAIL_VERIFICATION:
                await userIdentityService(log).sendVerifyEmail({ email })
                break
            case OtpType.PASSWORD_RESET:
                await userIdentityService(log).sendResetPasswordEmail({ email })
        }
    },
})

const sendAuditLogForIdentity = async (
    identityId: UserId,
    event: Pick<ApplicationEvent, 'action' | 'data'>,
    log: FastifyBaseLogger,
): Promise<void> => {
    const users = await userService(log).getUsersByIdentityId({ identityId })
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
