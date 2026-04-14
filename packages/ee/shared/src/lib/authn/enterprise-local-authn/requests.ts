import { SignUpRequest } from '@activepieces/shared'
import { z } from 'zod'

export enum OtpType {
    EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
    PASSWORD_RESET = 'PASSWORD_RESET',
}

export const VerifyEmailRequestBody = z.object({
    identityId: z.string(),
    otp: z.string(),
})
export type VerifyEmailRequestBody = z.infer<typeof VerifyEmailRequestBody>

export const ResetPasswordRequestBody = z.object({
    identityId: z.string(),
    otp: z.string(),
    newPassword: z.string(),
})
export type ResetPasswordRequestBody = z.infer<typeof ResetPasswordRequestBody>

export const SignUpAndAcceptRequestBody = SignUpRequest.omit({ referringUserId: true, email: true }).extend({
    invitationToken: z.string(),
})
export type SignUpAndAcceptRequestBody = z.infer<typeof SignUpAndAcceptRequestBody>

export const CreateOtpRequestBody = z.object({
    email: z.string(),
    type: z.nativeEnum(OtpType),
})
export type CreateOtpRequestBody = z.infer<typeof CreateOtpRequestBody>
