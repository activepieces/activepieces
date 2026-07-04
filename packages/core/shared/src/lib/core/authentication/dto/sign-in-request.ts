import { z } from 'zod'
import { EmailType, PasswordType } from '../../user/user'

export const SignInRequest = z.object({
    email: EmailType,
    password: PasswordType,
})

export type SignInRequest = z.infer<typeof SignInRequest>
