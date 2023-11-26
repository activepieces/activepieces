import { ApId } from '@activepieces/shared'
import { Type } from '@sinclair/typebox'

export const VerifyEmailRequestBody = Type.Object({
    otp: Type.String(),
})

export const ResetPasswordRequestBody = Type.Object({
    userId: ApId,
    otp: Type.String(),
    newPassword: Type.String(),
})
