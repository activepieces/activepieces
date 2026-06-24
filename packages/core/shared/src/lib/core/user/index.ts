import { z } from 'zod'
import { PlatformRole, UserStatus } from './user'

export * from './user'
export * from './badges'

export const UpdateUserRequestBody = z.object({
    status: z.nativeEnum(UserStatus).optional(),
    platformRole: z.nativeEnum(PlatformRole).optional(),
    externalId: z.string().optional(),
})

export type UpdateUserRequestBody = z.infer<typeof UpdateUserRequestBody>


export const ListUsersRequestBody = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().optional(),
    externalId: z.string().optional(),
})

export type ListUsersRequestBody = z.infer<typeof ListUsersRequestBody>
