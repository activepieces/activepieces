import { Static, Type } from '@sinclair/typebox'
import { PlatformRole, UserStatus } from './user'

export * from './user-dto'
export * from './user'

export const UpdateUserRequestBody = Type.Object({
    status: Type.Optional(Type.Enum(UserStatus)),
    platformRole: Type.Optional(Type.Enum(PlatformRole))
})

export type UpdateUserRequestBody = Static<typeof UpdateUserRequestBody>

export const CreateUserRequestBody = Type.Object({
    firstName: Type.String(),
    lastName: Type.String(),
    email: Type.String(),
    platformRole: Type.Enum(PlatformRole),
})
export type CreateUserRequestBody = Static<typeof CreateUserRequestBody>

