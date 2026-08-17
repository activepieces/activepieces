import { ApId, SAFE_STRING_PATTERN } from '@activepieces/core-utils'
import { z } from 'zod'
import { EmailType, PasswordType } from '../../user/user'
import { MAX_CAPTCHA_TOKEN_LENGTH } from './passwordless-request'

export const SignUpRequest = z.object({
    email: EmailType,
    password: PasswordType,
    firstName: z.string().regex(new RegExp(SAFE_STRING_PATTERN)),
    lastName: z.string().regex(new RegExp(SAFE_STRING_PATTERN)),
    trackEvents: z.boolean(),
    newsLetter: z.boolean(),
    captchaToken: z.string().trim().min(1).max(MAX_CAPTCHA_TOKEN_LENGTH).optional(),
})

export type SignUpRequest = z.infer<typeof SignUpRequest>

export const SwitchPlatformRequest = z.object({
    platformId: ApId,
})

export type SwitchPlatformRequest = z.infer<typeof SwitchPlatformRequest>
