import {
    OtpType,
    ResetPasswordRequestBody,
    VerifyEmailRequestBody,
} from '@activepieces/ee-shared'
import { ActivepiecesError, ErrorCode, UserId } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { userService } from '../../../user/user-service'
import { otpService } from '../../otp/otp-service'

export const enterpriseLocalAuthnService = (log: FastifyBaseLogger) => ({
    async verifyEmail({ userId, otp }: VerifyEmailRequestBody): Promise<void> {
        await confirmOtp({
            userId,
            otp,
            otpType: OtpType.EMAIL_VERIFICATION,
            log,
        })

        await userService.verify({ id: userId })
    },

    async resetPassword({
        userId,
        otp,
        newPassword,
    }: ResetPasswordRequestBody): Promise<void> {
        await confirmOtp({
            userId,
            otp,
            otpType: OtpType.PASSWORD_RESET,
            log,
        })

        await userService.updatePassword({
            id: userId,
            newPassword,
        })
    },
})

const confirmOtp = async ({
    userId,
    otp,
    otpType,
    log,
}: ConfirmOtpParams): Promise<void> => {
    const isOtpValid = await otpService(log).confirm({
        userId,
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
    userId: UserId
    otp: string
    otpType: OtpType
    log: FastifyBaseLogger
}
