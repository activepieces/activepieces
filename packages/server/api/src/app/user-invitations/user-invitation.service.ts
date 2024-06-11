
import dayjs from 'dayjs'
import { IsNull, MoreThanOrEqual } from 'typeorm'

import { databaseConnection } from '../database/database-connection'
import { emailService } from '../ee/helper/email/email-service'
import { projectMemberService } from '../ee/project-members/project-member.service'
import { jwtUtils } from '../helper/jwt-utils'
import { buildPaginator } from '../helper/pagination/build-paginator'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { userService } from '../user/user-service'
import { UserInvitationEntity } from './user-invitation.entity'
import { ActivepiecesError, apId, assertNotNullOrUndefined, ErrorCode, InvitationStatus, InvitationType, isNil, PlatformRole, ProjectMemberRole, SeekPage, spreadIfDefined, UserInvitation } from '@activepieces/shared'

const repo = databaseConnection.getRepository(UserInvitationEntity)
export const INVITATION_EXPIREY_DATS = 1

export const userInvitationsService = {
    async countByProjectId(projectId: string): Promise<number> {
        return repo.countBy({
            projectId,
        })
    },
    provisionUserInvitation: async ({ email, platformId }: ProvisionUserInvitationParams): Promise<void> => {
        const user = await userService.getByPlatformAndEmail({
            email,
            platformId,
        })
        if (isNil(user)) {
            return
        }
        const ONE_DAY_AGO = dayjs().subtract(INVITATION_EXPIREY_DATS, 'day').toISOString()
        const invitations = await repo.findBy([
            {
                email,
                platformId,
                status: InvitationStatus.ACCEPTED,
                created: MoreThanOrEqual(ONE_DAY_AGO),
            },
        ])
        for (const invitation of invitations) {
            switch (invitation.type) {
                case InvitationType.PLATFORM: {
                    assertNotNullOrUndefined(invitation.platformRole, 'platformRole')
                    await userService.update({
                        id: user.id,
                        platformId: invitation.platformId,
                        platformRole: invitation.platformRole,
                    })
                    break
                }
                case InvitationType.PROJECT: {
                    const { projectId, projectRole } = invitation
                    assertNotNullOrUndefined(projectId, 'projectId')
                    assertNotNullOrUndefined(projectRole, 'projectRole')
                    await projectMemberService.upsert({
                        projectId,
                        userId: user.id,
                        role: projectRole,
                    })
                    break
                }
            }
            await repo.delete({
                id: invitation.id,
            })
        }
    },
    async create({
        email,
        platformId,
        projectId,
        type,
        projectRole,
        platformRole,
    }: CreateParams): Promise<UserInvitation> {
        const invitation = await repo.findOneBy({
            email,
            platformId,
            projectId: isNil(projectId) ? IsNull() : projectId,
        })
        if (!isNil(invitation)) {
            return invitation
        }
        const id = apId()
        await repo.upsert({
            id,
            status: InvitationStatus.PENDING,
            type,
            email,
            platformId,
            projectRole: type === InvitationType.PLATFORM ? undefined : projectRole!,
            platformRole: type === InvitationType.PROJECT ? undefined : platformRole!,
            projectId: type === InvitationType.PLATFORM ? undefined : projectId!,
        }, ['email', 'platformId', 'projectId'])

        const userInvitation = await this.getOneOrThrow({
            id,
            platformId,

        })
        await emailService.sendInvitation({
            userInvitation,
        })
        return userInvitation
    },
    async list(params: ListUserParams): Promise<SeekPage<UserInvitation>> {
        const decodedCursor = paginationHelper.decodeCursor(params.cursor ?? null)
        const paginator = buildPaginator({
            entity: UserInvitationEntity,
            query: {
                limit: params.limit,
                order: 'ASC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })
        const queryBuilder = repo.createQueryBuilder('user_invitation').where({
            platformId: params.platformId,
            ...spreadIfDefined('projectId', params.projectId),
            ...spreadIfDefined('status', params.status),
            ...spreadIfDefined('type', params.type),
        })
        const { data, cursor } = await paginator.paginate(queryBuilder)
        return paginationHelper.createPage<UserInvitation>(data, cursor)
    },
    async delete({ id, platformId }: PlatformAndIdParams): Promise<void> {
        const invitation = await this.getOneOrThrow({ id, platformId })
        await repo.delete({
            id: invitation.id,
            platformId,
        })
    },
    async getOneOrThrow({ id, platformId }: PlatformAndIdParams): Promise<UserInvitation> {
        const invitation = await repo.findOneBy({
            id,
            platformId,
        })
        if (isNil(invitation)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: `id=${id}`,
                    entityType: 'UserInvitation',
                },
            })
        }
        return invitation
    },
    async accept({ invitationToken }: AcceptParams): Promise<{ registered: boolean }> {
        const invitation = await getByInvitationTokenOrThrow(
            invitationToken,
        )
        await repo.update(invitation.id, {
            status: InvitationStatus.ACCEPTED,
        })
        await userInvitationsService.provisionUserInvitation({
            email: invitation.email,
            platformId: invitation.platformId,
        })
        const user = await userService.getByPlatformAndEmail({
            email: invitation.email,
            platformId: invitation.platformId,
        })
        return {
            registered: !isNil(user),
        }
    },
    async hasAnyAcceptedInvitations({
        email,
        platformId,
    }: ProvisionUserInvitationParams): Promise<boolean> {
        const invitations = await repo.findBy({
            email,
            platformId,
            status: InvitationStatus.ACCEPTED,
        })
        return invitations.length > 0
    },
    async getByEmailAndPlatformIdOrThrow({
        email,
        platformId,
        projectId,
    }: GetOneByPlatformIdAndEmailParams): Promise<UserInvitation | null> {
        return repo.findOneBy({
            email,
            platformId,
            projectId: isNil(projectId) ? IsNull() : projectId,
        })
    },
}


type ListUserParams = {
    platformId: string
    type: InvitationType
    projectId: string | null
    status?: InvitationStatus
    limit: number
    cursor: string | null
}

type ProvisionUserInvitationParams = {
    email: string
    platformId: string
}

type PlatformAndIdParams = {
    id: string
    platformId: string
}
type UserInvitationToken = {
    id: string
}

async function getByInvitationTokenOrThrow(
    invitationToken: string,
): Promise<UserInvitation> {
    const { id: projectMemberId } =
        await jwtUtils.decodeAndVerify<UserInvitationToken>({
            jwt: invitationToken,
            key: await jwtUtils.getJwtSecret(),
        })
    const userInvitation = await repo.findOneBy({
        id: projectMemberId,
    })
    if (isNil(userInvitation)) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                message: `Project Member Id ${projectMemberId} is not found`,
            },
        })
    }
    return userInvitation
}


export type AcceptParams = {
    invitationToken: string
}

export type CreateParams = {
    email: string
    platformId: string
    platformRole: PlatformRole | null
    projectId: string | null
    type: InvitationType
    projectRole: ProjectMemberRole | null
}

export type DeleteParams = {
    id: string
    platformId: string
}

export type GetOneByPlatformIdAndEmailParams = {
    email: string
    platformId: string
    projectId: string | null
}
