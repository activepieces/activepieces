import { Static, Type } from '@sinclair/typebox'
import { PlatformRole, UserStatus } from './user'

export * from './user-dto'
export * from './user'

export const UpdateUserRequestBody = Type.Object({
    status: Type.Optional(Type.Enum(UserStatus)),
    platformRole: Type.Optional(Type.Enum(PlatformRole)),
    externalId: Type.Optional(Type.String()),
})

export type UpdateUserRequestBody = Static<typeof UpdateUserRequestBody>

