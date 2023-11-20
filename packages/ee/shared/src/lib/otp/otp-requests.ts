import { Static, Type } from '@sinclair/typebox'
import { OtpType } from './otp-type'
import { OtpModel } from './otp-model'

export const CreateOtpRequestBody = Type.Object({
    email: Type.String(),
    type: Type.Enum(OtpType),
})

export type CreateOtpRequestBody = Static<typeof CreateOtpRequestBody>

export const OtpResponse = Type.Omit(OtpModel, ['value'])

export type OtpResponse = Static<typeof OtpResponse>
