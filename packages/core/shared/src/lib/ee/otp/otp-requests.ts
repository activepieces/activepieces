import { z } from 'zod'
import { OtpType } from './otp-type'


export const CreateOtpRequestBody = z.object({
    email: z.string(),
    type: z.enum([OtpType.EMAIL_VERIFICATION, OtpType.PASSWORD_RESET]),
})

export type CreateOtpRequestBody = z.infer<typeof CreateOtpRequestBody>
