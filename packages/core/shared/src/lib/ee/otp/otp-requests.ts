import { z } from 'zod'
import { CaptchaToken } from '../../core/authentication/dto/captcha'
import { OtpType } from './otp-type'


export const CreateOtpRequestBody = z.object({
    email: z.string(),
    type: z.enum([OtpType.EMAIL_VERIFICATION, OtpType.PASSWORD_RESET]),
    captchaToken: CaptchaToken,
})

export type CreateOtpRequestBody = z.infer<typeof CreateOtpRequestBody>
