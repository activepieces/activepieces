import { OptionalArrayFromQuery } from '@activepieces/core-utils'
import { z } from 'zod'
import { UserStatus, UserWithMetaInformation } from '../../core/user'
import { UserInvitation } from '../invitations'

// The platform admin Users page lists pending invitations and users as one list.
export const INVITED_USER_STATUS = 'INVITED'

export const PlatformUserListStatus = z.union([z.enum(UserStatus), z.literal(INVITED_USER_STATUS)])
export type PlatformUserListStatus = z.infer<typeof PlatformUserListStatus>

export const PLATFORM_USER_LIST_STATUSES: PlatformUserListStatus[] = [INVITED_USER_STATUS, UserStatus.ACTIVE, UserStatus.INACTIVE]

export const ListPlatformUsersWithInvitationsRequest = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    status: OptionalArrayFromQuery(PlatformUserListStatus),
})
export type ListPlatformUsersWithInvitationsRequest = z.infer<typeof ListPlatformUsersWithInvitationsRequest>

export const PlatformUserListItem = z.discriminatedUnion('type', [
    z.object({ id: z.string(), type: z.literal('user'), data: UserWithMetaInformation }),
    z.object({ id: z.string(), type: z.literal('invitation'), data: UserInvitation }),
])
export type PlatformUserListItem = z.infer<typeof PlatformUserListItem>
