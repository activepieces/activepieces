import { Static, Type } from '@sinclair/typebox'
import { OtpType } from './otp-type'


export const CreateOtpRequestBody = Type.Object({
    email: Type.String(),
    type: Type.Enum(OtpType),
})

export type CreateOtpRequestBody = Static<typeof CreateOtpRequestBody>

