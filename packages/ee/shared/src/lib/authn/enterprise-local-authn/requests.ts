import { Static, Type } from '@sinclair/typebox'

export const VerifyEmailRequestBody = Type.Object({
    otp: Type.String(),
})
export type VerifyEmailRequestBody = Static<typeof VerifyEmailRequestBody>;

export const ResetPasswordRequestBody = Type.Object({
    otp: Type.String(),
    newPassword: Type.String(),
})
export type ResetPasswordRequestBody = Static<typeof ResetPasswordRequestBody>;