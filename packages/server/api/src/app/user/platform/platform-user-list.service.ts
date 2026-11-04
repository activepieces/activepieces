import { isNil, SeekPage } from '@activepieces/core-utils'
import { InvitationStatus, InvitationType, INVITED_USER_STATUS, PlatformUserListItem, PlatformUserListStatus, UserInvitation, UserStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { In } from 'typeorm'
import { projectRoleService } from '../../ee/projects/project-role/project-role.service'
import { projectService } from '../../project/project-service'
import { userInvitationRepo } from '../../user-invitations/user-invitation.service'
import { userRepo, userService } from '../user-service'

/**
 * The admin Users page shows pending invitations and users as one list:
 * invitations first (newest first), then users (newest first).
 * It pages by offset, so every page is full and the status filter applies to the whole list.
 */
export const platformUserListService = (log: FastifyBaseLogger) => ({
    async list({ platformId, statuses, cursor, limit }: ListParams): Promise<SeekPage<PlatformUserListItem>> {
        const offset = decodeOffset(cursor)
        const userStatuses = statuses.filter((status): status is UserStatus => status !== INVITED_USER_STATUS)
        const includeInvitations = statuses.includes(INVITED_USER_STATUS)

        const invitationsQuery = userInvitationRepo().createQueryBuilder('user_invitation').where({
            platformId,
            type: InvitationType.PLATFORM,
            status: InvitationStatus.PENDING,
        })
        const usersQuery = userRepo().createQueryBuilder('user').where({
            platformId,
            status: In(userStatuses),
        })

        const [invitationCount, userCount] = await Promise.all([
            includeInvitations ? invitationsQuery.getCount() : 0,
            userStatuses.length > 0 ? usersQuery.getCount() : 0,
        ])

        const invitationSkip = Math.min(offset, invitationCount)
        const invitationTake = Math.max(0, Math.min(limit, invitationCount - offset))
        const userSkip = Math.max(0, offset - invitationCount)
        const userTake = limit - invitationTake

        const [invitations, users] = await Promise.all([
            invitationTake > 0
                ? invitationsQuery.orderBy('user_invitation.created', 'DESC').addOrderBy('user_invitation.id', 'DESC').skip(invitationSkip).take(invitationTake).getMany()
                : [],
            userTake > 0 && userCount > userSkip
                ? usersQuery.orderBy('user.created', 'DESC').addOrderBy('user.id', 'DESC').skip(userSkip).take(userTake).getMany()
                : [],
        ])

        const [invitationRows, userRows] = await Promise.all([
            withProjectRoles(invitations),
            withMetaInformation({ log, platformId, users }),
        ])

        const total = invitationCount + userCount
        return {
            data: [...invitationRows, ...userRows],
            next: offset + limit < total ? encodeOffset(offset + limit) : null,
            previous: offset > 0 ? encodeOffset(Math.max(0, offset - limit)) : null,
        }
    },
})

async function withProjectRoles(invitations: UserInvitation[]): Promise<PlatformUserListItem[]> {
    return Promise.all(invitations.map(async (invitation) => ({
        id: invitation.id,
        type: 'invitation' as const,
        data: {
            ...invitation,
            projectRole: isNil(invitation.projectRoleId) ? null : await projectRoleService.getOneOrThrowById({ id: invitation.projectRoleId }),
        },
    })))
}

async function withMetaInformation({ log, platformId, users }: WithMetaInformationParams): Promise<PlatformUserListItem[]> {
    const [usersWithMeta, userIdsWithProjects] = await Promise.all([
        Promise.all(users.map((user) => userService(log).getMetaInformation({ id: user.id }))),
        projectService(log).listUserIdsWithProjects({ platformId, userIds: users.map((user) => user.id) }),
    ])
    return usersWithMeta.map((user) => ({
        id: user.id,
        type: 'user' as const,
        data: { ...user, hasProjects: userIdsWithProjects.includes(user.id) },
    }))
}

function decodeOffset(cursor: string | undefined): number {
    const offset = isNil(cursor) ? 0 : Number(cursor)
    return Number.isInteger(offset) && offset > 0 ? offset : 0
}

function encodeOffset(offset: number): string {
    return String(offset)
}

type ListParams = {
    platformId: string
    statuses: PlatformUserListStatus[]
    cursor: string | undefined
    limit: number
}

type WithMetaInformationParams = {
    log: FastifyBaseLogger
    platformId: string
    users: { id: string }[]
}
