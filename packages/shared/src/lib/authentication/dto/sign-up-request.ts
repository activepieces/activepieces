import { Static, Type } from '@sinclair/typebox'
import { EmailType, PasswordType } from '../../user/user'
import { ApId } from '../../common/id-generator'

export const SignUpRequest = Type.Object({
    email: EmailType,
    password: PasswordType,
    firstName: Type.String(),
    lastName: Type.String(),
    trackEvents: Type.Boolean(),
    newsLetter: Type.Boolean(),
    referringUserId: Type.Optional(ApId),
})

export type SignUpRequest = Static<typeof SignUpRequest>
