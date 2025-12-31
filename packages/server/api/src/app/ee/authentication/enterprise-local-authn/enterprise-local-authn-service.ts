import {
    ResetPasswordRequestBody,
    VerifyEmailRequestBody,
} from '@activepieces/ee-shared'
import { UserIdentity } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { userIdentityService } from '../../../authentication/user-identity/user-identity-service'
import { CreateOtpRequestBody, OtpType } from '@ee/shared/src/lib/authn'

export const enterpriseLocalAuthnService = (log: FastifyBaseLogger) => ({
    async verifyEmail({ identityId, otp }: VerifyEmailRequestBody): Promise<UserIdentity> {
        return userIdentityService(log).verifyEmail({ identityId, otp })
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
    },

    async sendOTP({
        email,
        type
    }: CreateOtpRequestBody): Promise<void> {
        switch(type){
            case OtpType.EMAIL_VERIFICATION: 
                await userIdentityService(log).sendVerifyEmail({ email })
                break;
            case OtpType.PASSWORD_RESET:
                await userIdentityService(log).sendResetPasswordEmail({ email })
        }
    }
})
