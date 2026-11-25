import { ApId } from '@activepieces/core-utils'
import { z } from 'zod'
import { CaptchaToken } from '../../../core/authentication/dto/passwordless-request'
import { SignUpRequest } from '../../../core/authentication/dto/sign-up-request'
import { PasswordType } from '../../../core/user/user'

export const VerifyEmailRequestBody = z.object({
    identityId: ApId,
    otp: z.string(),
    captchaToken: CaptchaToken,
})
export type VerifyEmailRequestBody = z.infer<typeof VerifyEmailRequestBody>

export const ResetPasswordRequestBody = z.object({
    identityId: ApId,
    otp: z.string(),
    newPassword: PasswordType,
    captchaToken: CaptchaToken,
})
export type ResetPasswordRequestBody = z.infer<typeof ResetPasswordRequestBody>

export const SignUpAndAcceptRequestBody = SignUpRequest.omit({ email: true }).extend({
    invitationToken: z.string(),
})

export type SignUpAndAcceptRequestBody = z.infer<typeof SignUpAndAcceptRequestBody>
