import { assertNotNullOrUndefined, isNil, SeekPage } from '@activepieces/core-utils'
import { InvitationStatus, InvitationType, INVITED_USER_STATUS, PlatformUserListItem, PlatformUserListStatus, UserInvitation, UserStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { In } from 'typeorm'
import { userIdentityRepository } from '../../authentication/user-identity/user-identity-service'
import { projectRoleRepo } from '../../ee/projects/project-role/project-role.service'
import { projectService } from '../../project/project-service'
import { userInvitationRepo } from '../../user-invitations/user-invitation.service'
import { UserSchema } from '../user-entity'
import { userRepo } from '../user-service'

/**
 * The admin Users page shows pending invitations and users as one list:
 * invitations first (newest first), then users (newest first).
 * It pages by offset, so every page is full and the status filter applies to the whole list.
 */
export const platformUserListService = (log: FastifyBaseLogger) => ({
    async list({ platformId, statuses, cursor, limit }: ListParams): Promise<SeekPage<PlatformUserListItem>> {
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
        const total = invitationCount + userCount
        // A cursor past the end (e.g. a stale link) lands on the last page.
        const offset = Math.min(decodeOffset(cursor), lastPageOffset({ total, limit }))

        const invitationTake = Math.max(0, Math.min(limit, invitationCount - offset))
        const userSkip = Math.max(0, offset - invitationCount)
        const userTake = limit - invitationTake

        const [invitations, users] = await Promise.all([
            invitationTake > 0
                ? invitationsQuery.orderBy('user_invitation.created', 'DESC').addOrderBy('user_invitation.id', 'DESC').skip(offset).take(invitationTake).getMany()
                : [],
            userTake > 0 && userCount > userSkip
                ? usersQuery.orderBy('user.created', 'DESC').addOrderBy('user.id', 'DESC').skip(userSkip).take(userTake).getMany()
                : [],
        ])

        const [invitationRows, userRows] = await Promise.all([
            toInvitationRows(invitations),
            toUserRows({ log, platformId, users }),
        ])

        return {
            data: [...invitationRows, ...userRows],
            next: offset + limit < total ? encodeOffset(offset + limit) : null,
            previous: offset > 0 ? encodeOffset(Math.max(0, offset - limit)) : null,
        }
    },
})

async function toInvitationRows(invitations: UserInvitation[]): Promise<PlatformUserListItem[]> {
    const roleIds = invitations.map((invitation) => invitation.projectRoleId).filter((id): id is string => !isNil(id))
    const roles = roleIds.length > 0 ? await projectRoleRepo().findBy({ id: In(roleIds) }) : []
    return invitations.map((invitation) => ({
        id: invitation.id,
        type: 'invitation' as const,
        data: {
            ...invitation,
            projectRole: roles.find((role) => role.id === invitation.projectRoleId) ?? null,
        },
    }))
}

async function toUserRows({ log, platformId, users }: ToUserRowsParams): Promise<PlatformUserListItem[]> {
    if (users.length === 0) {
        return []
    }
    const [identities, userIdsWithProjects] = await Promise.all([
        userIdentityRepository().findBy({ id: In(users.map((user) => user.identityId)) }),
        projectService(log).listUserIdsWithProjects({ platformId, userIds: users.map((user) => user.id) }),
    ])
    return users.map((user) => {
        const identity = identities.find((candidate) => candidate.id === user.identityId)
        assertNotNullOrUndefined(identity, 'identity')
        return {
            id: user.id,
            type: 'user' as const,
            data: {
                id: user.id,
                email: identity.email,
                firstName: identity.firstName,
                lastName: identity.lastName,
                platformId: user.platformId,
                platformRole: user.platformRole,
                status: user.status,
                externalId: user.externalId,
                created: user.created,
                updated: user.updated,
                lastActiveDate: user.lastActiveDate,
                imageUrl: identity.imageUrl,
                hasProjects: userIdsWithProjects.includes(user.id),
            },
        }
    })
}

function lastPageOffset({ total, limit }: { total: number, limit: number }): number {
    return total === 0 ? 0 : Math.floor((total - 1) / limit) * limit
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

type ToUserRowsParams = {
    log: FastifyBaseLogger
    platformId: string
    users: UserSchema[]
}
