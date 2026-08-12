import { z } from 'zod'
import { EmailType } from '../../user/user'

export const MAX_FULL_NAME_LENGTH = 100
export const MAX_CAPTCHA_TOKEN_LENGTH = 2048

export const RequestEmailCodeRequest = z.object({
    email: EmailType,
    captchaToken: z.string().trim().min(1).max(MAX_CAPTCHA_TOKEN_LENGTH).optional(),
})

export type RequestEmailCodeRequest = z.infer<typeof RequestEmailCodeRequest>

export const VerifyEmailCodeRequest = z.object({
    email: EmailType,
    code: z.string().trim().min(1),
})

export type VerifyEmailCodeRequest = z.infer<typeof VerifyEmailCodeRequest>

export const CompleteSignUpRequest = z.object({
    fullName: z.string().trim().min(1).max(MAX_FULL_NAME_LENGTH),
})

export type CompleteSignUpRequest = z.infer<typeof CompleteSignUpRequest>
