import { SignUpRequest } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'

export enum OtpType {
    EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
    PASSWORD_RESET = 'PASSWORD_RESET',
}


export const VerifyEmailRequestBody = Type.Object({
    identityId: Type.String(),
    otp: Type.String(),
})
export type VerifyEmailRequestBody = Static<typeof VerifyEmailRequestBody>

export const ResetPasswordRequestBody = Type.Object({
    identityId: Type.String(),
    otp: Type.String(),
    newPassword: Type.String(),
})
export type ResetPasswordRequestBody = Static<typeof ResetPasswordRequestBody>

export const SignUpAndAcceptRequestBody = Type.Composite([
    Type.Omit(SignUpRequest, ['referringUserId', 'email']),
    Type.Object({
        invitationToken: Type.String(),
    }),
])

export type SignUpAndAcceptRequestBody = Static<typeof SignUpAndAcceptRequestBody>


export const CreateOtpRequestBody = Type.Object({
    email: Type.String(),
    type: Type.Enum(OtpType),
})

export type CreateOtpRequestBody = Static<typeof CreateOtpRequestBody>