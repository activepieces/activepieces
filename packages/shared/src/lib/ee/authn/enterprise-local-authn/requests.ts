import { z } from 'zod'
import { SignUpRequest } from '../../../core/authentication/dto/sign-up-request'
import { ApId } from '../../../core/common/id-generator'

export enum OtpType {
    EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
    PASSWORD_RESET = 'PASSWORD_RESET',
}

export const CreateOtpRequestBody = z.object({
    email: z.string(),
    type: z.nativeEnum(OtpType),
})
export type CreateOtpRequestBody = z.infer<typeof CreateOtpRequestBody>

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
