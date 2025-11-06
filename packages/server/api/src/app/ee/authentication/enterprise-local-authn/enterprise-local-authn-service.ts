import {
    OtpType,
    ResetPasswordRequestBody,
    VerifyEmailRequestBody,
} from '@activepieces/ee-shared'
import { ActivepiecesError, ErrorCode, UserId, UserIdentity } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { userIdentityService } from '../../../authentication/user-identity/user-identity-service'
import { otpService } from '../otp/otp-service'

export const enterpriseLocalAuthnService = (log: FastifyBaseLogger) => ({
    async verifyEmail({ identityId, otp }: VerifyEmailRequestBody): Promise<UserIdentity> {
        await confirmOtp({
            identityId,
            otp,
            otpType: OtpType.EMAIL_VERIFICATION,
            log,
        })

        return userIdentityService(log).verify(identityId)
    },

    async resetPassword({
        identityId,
        otp,
        newPassword,
    }: ResetPasswordRequestBody): Promise<void> {
        await confirmOtp({
            identityId,
            otp,
            otpType: OtpType.PASSWORD_RESET,
            log,
        })

        await userIdentityService(log).updatePassword({
            id: identityId,
            newPassword,
        })
    },
})

const confirmOtp = async ({
    identityId,
    otp,
    otpType,
    log,
}: ConfirmOtpParams): Promise<void> => {
    const isOtpValid = await otpService(log).confirm({
        identityId,
        type: otpType,
        value: otp,
    })

    if (!isOtpValid) {
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_OTP,
            params: {},
        })
    }
}

type ConfirmOtpParams = {
    identityId: UserId
    otp: string
    otpType: OtpType
    log: FastifyBaseLogger
}
