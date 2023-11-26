import { UserId, ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { OtpType, ResetPasswordRequestBody, VerifyEmailRequestBody } from '@activepieces/ee-shared'
import { userService } from '../../../user/user-service'
import { otpService } from '../../otp/otp-service'

export const enterpriseLocalAuthnService = {
    async verifyEmail({  otp }: VerifyEmailRequestBody): Promise<void> {
        const otpEntity = await otpService.getOtp(otp)
        await confirmOtp({
            userId: otpEntity.userId,
            otp,
            otpType: OtpType.EMAIL_VERIFICATION,
        })

        await userService.verify({ id: otpEntity.userId })
    },

    async resetPassword({ otp, newPassword }: ResetPasswordRequestBody): Promise<void> {
        const otpEntity = await otpService.getOtp(otp)
        await confirmOtp({
            userId: otpEntity.userId,
            otp,
            otpType: OtpType.PASSWORD_RESET,
        })

        await userService.updatePassword({
            id: otpEntity.userId,
            newPassword,
        })
    },
}

const confirmOtp = async ({ userId, otp, otpType }: ConfirmOtpParams): Promise<void> => {
    const isOtpValid = await otpService.confirm({
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
}
