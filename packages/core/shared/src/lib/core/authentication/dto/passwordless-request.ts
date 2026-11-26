import { z } from 'zod'
import { AttributionParams } from '../../common/attribution'
import { EmailType } from '../../user/user'
import { CaptchaToken } from './captcha'

export const MAX_FULL_NAME_LENGTH = 100

export const RequestEmailCodeRequest = z.object({
    email: EmailType,
    captchaToken: CaptchaToken,
})

export type RequestEmailCodeRequest = z.infer<typeof RequestEmailCodeRequest>

export const VerifyEmailCodeRequest = z.object({
    email: EmailType,
    code: z.string().trim().min(1),
    captchaToken: CaptchaToken,
    attribution: AttributionParams.optional(),
})

export type VerifyEmailCodeRequest = z.infer<typeof VerifyEmailCodeRequest>

export const CompleteSignUpRequest = z.object({
    fullName: z.string().trim().min(1).max(MAX_FULL_NAME_LENGTH),
    attribution: AttributionParams.optional(),
})

export type CompleteSignUpRequest = z.infer<typeof CompleteSignUpRequest>
