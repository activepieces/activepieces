import { z } from 'zod'
import { AttributionParams } from '../../common/attribution'
import { EmailType, PasswordType } from '../../user/user'

export const SignInRequest = z.object({
    email: EmailType,
    password: PasswordType,
    attribution: AttributionParams.optional(),
})

export type SignInRequest = z.infer<typeof SignInRequest>
