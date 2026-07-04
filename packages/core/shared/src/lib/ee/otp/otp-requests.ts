import { z } from 'zod'
import { OtpType } from './otp-type'


export const CreateOtpRequestBody = z.object({
    email: z.string(),
    type: z.nativeEnum(OtpType),
})

export type CreateOtpRequestBody = z.infer<typeof CreateOtpRequestBody>
