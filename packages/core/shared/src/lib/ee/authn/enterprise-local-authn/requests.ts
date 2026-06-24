import { ApId } from '@activepieces/core-utils'
import { z } from 'zod'
import { SignUpRequest } from '../../../core/authentication/dto/sign-up-request'

export const VerifyEmailRequestBody = z.object({
    identityId: ApId,
    otp: z.string(),
})
export type VerifyEmailRequestBody = z.infer<typeof VerifyEmailRequestBody>

export const ResetPasswordRequestBody = z.object({
    identityId: ApId,
    otp: z.string(),
    newPassword: z.string(),
})
export type ResetPasswordRequestBody = z.infer<typeof ResetPasswordRequestBody>

export const SignUpAndAcceptRequestBody = SignUpRequest.omit({ email: true }).extend({
    invitationToken: z.string(),
})

export type SignUpAndAcceptRequestBody = z.infer<typeof SignUpAndAcceptRequestBody>
