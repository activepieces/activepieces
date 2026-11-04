import { assertNotNullOrUndefined, isNil, SeekPage } from '@activepieces/core-utils'
import { InvitationType, INVITED_USER_STATUS, PlatformUserListItem, PlatformUserListStatus, UserInvitation, UserStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { In } from 'typeorm'
import { projectService } from '../../project/project-service'
import { userInvitationRepo, userInvitationsService } from '../../user-invitations/user-invitation.service'
import { UserSchema } from '../user-entity'
import { mapToUserWithMetaInformation, userRepo } from '../user-service'

export const platformUserListService = (log: FastifyBaseLogger) => ({
    async list({ platformId, statuses, cursor, limit }: ListParams): Promise<SeekPage<PlatformUserListItem>> {
        const userStatuses = statuses.filter((status): status is UserStatus => status !== INVITED_USER_STATUS)
        const includeInvitations = statuses.includes(INVITED_USER_STATUS)

        const invitationsQuery = userInvitationRepo().createQueryBuilder('user_invitation').where({
            platformId,
            type: InvitationType.PLATFORM,
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
        const offset = decodeOffset(cursor)

        if (offset > 0 && offset >= total) {
            return {
                data: [],
                next: null,
                previous: total > 0 ? encodeOffset(lastPageOffset({ total, limit })) : null,
            }
        }

        const invitationTake = Math.max(0, Math.min(limit, invitationCount - offset))
        const userSkip = Math.max(0, offset - invitationCount)
        const userTake = limit - invitationTake

        const [invitations, users] = await Promise.all([
            invitationTake > 0
                ? invitationsQuery.orderBy('user_invitation.created', 'DESC').addOrderBy('user_invitation.id', 'DESC').skip(offset).take(invitationTake).getMany()
                : [],
            userTake > 0 && userCount > userSkip
                ? usersQuery.leftJoinAndSelect('user.identity', 'identity').orderBy('user.created', 'DESC').addOrderBy('user.id', 'DESC').skip(userSkip).take(userTake).getMany()
                : [],
        ])

        const [invitationRows, userRows] = await Promise.all([
            toInvitationRows({ log, invitations }),
            toUserRows({ log, platformId, users }),
        ])

        return {
            data: [...invitationRows, ...userRows],
            next: offset + limit < total ? encodeOffset(offset + limit) : null,
            previous: offset > 0 ? encodeOffset(Math.max(0, offset - limit)) : null,
        }
    },
})

async function toInvitationRows({ log, invitations }: ToInvitationRowsParams): Promise<PlatformUserListItem[]> {
    const withRoles = await userInvitationsService(log).withProjectRoles(invitations)
    return withRoles.map((invitation): PlatformUserListItem => ({ id: invitation.id, type: 'invitation', data: invitation }))
}

async function toUserRows({ log, platformId, users }: ToUserRowsParams): Promise<PlatformUserListItem[]> {
    if (users.length === 0) {
        return []
    }
    const userIdsWithProjects = await projectService(log).listUserIdsWithProjects({ platformId, userIds: users.map((user) => user.id) })
    return users.map((user): PlatformUserListItem => {
        const metaInformation = mapToUserWithMetaInformation(user)
        assertNotNullOrUndefined(metaInformation, 'metaInformation')
        return {
            id: user.id,
            type: 'user',
            data: { ...metaInformation, hasProjects: userIdsWithProjects.includes(user.id) },
        }
    })
}

function lastPageOffset({ total, limit }: { total: number, limit: number }): number {
    return Math.floor((total - 1) / limit) * limit
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

type ToInvitationRowsParams = {
    log: FastifyBaseLogger
    invitations: UserInvitation[]
}

type ToUserRowsParams = {
    log: FastifyBaseLogger
    platformId: string
    users: UserSchema[]
}
