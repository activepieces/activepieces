import { Static, Type } from '@sinclair/typebox'
import { PlatformRole, UserStatus } from './user'

export * from './user'

export const UpdateUserRequestBody = Type.Object({
    status: Type.Optional(Type.Enum(UserStatus)),
    platformRole: Type.Optional(Type.Enum(PlatformRole)),
    externalId: Type.Optional(Type.String()),
    lastChangelogDismissed: Type.Optional(Type.String()),
})

export type UpdateUserRequestBody = Static<typeof UpdateUserRequestBody>


export const ListUsersRequestBody = Type.Object({
    cursor: Type.Optional(Type.String()),
    limit: Type.Optional(Type.Number()),
    externalId: Type.Optional(Type.String()),
})

export type ListUsersRequestBody = Static<typeof ListUsersRequestBody>