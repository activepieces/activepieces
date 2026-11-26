import { z } from 'zod'

export const MAX_CAPTCHA_TOKEN_LENGTH = 2048
export const CaptchaToken = z.string().trim().min(1).max(MAX_CAPTCHA_TOKEN_LENGTH).optional()
