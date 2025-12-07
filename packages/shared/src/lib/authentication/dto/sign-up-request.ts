import { Static, Type } from '@sinclair/typebox'
import { SAFE_STRING_PATTERN } from '../../common'
import { ApId } from '../../common/id-generator'
import { EmailType, PasswordType } from '../../user/user'

export const SignUpRequest = Type.Object({
    email: EmailType,
    password: PasswordType,
    firstName: Type.String({
        pattern: SAFE_STRING_PATTERN,
    }),
    lastName: Type.String({
        pattern: SAFE_STRING_PATTERN,
    }),
    trackEvents: Type.Boolean(),
    newsLetter: Type.Boolean(),
})

export type SignUpRequest = Static<typeof SignUpRequest>

export const SwitchPlatformRequest = Type.Object({
    platformId: ApId,
})

export type SwitchPlatformRequest = Static<typeof SwitchPlatformRequest>

export const SwitchProjectRequest = Type.Object({
    projectId: ApId,
})

export type SwitchProjectRequest = Static<typeof SwitchProjectRequest>