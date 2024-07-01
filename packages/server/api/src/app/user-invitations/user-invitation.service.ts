
import { ActivepiecesError, apId, assertEqual, assertNotNullOrUndefined, ErrorCode, InvitationStatus, InvitationType, isNil, PlatformRole, ProjectMemberRole, SeekPage, spreadIfDefined, UserInvitation, UserInvitationWithLink } from '@activepieces/shared'
import dayjs from 'dayjs'
import { IsNull, MoreThanOrEqual } from 'typeorm'

import { databaseConnection } from '../database/database-connection'
import { smtpEmailSender } from '../ee/helper/email/email-sender/smtp-email-sender'
import { emailService } from '../ee/helper/email/email-service'
import { platformDomainHelper } from '../ee/helper/platform-domain-helper'
import { projectMemberService } from '../ee/project-members/project-member.service'
import { jwtUtils } from '../helper/jwt-utils'
import { buildPaginator } from '../helper/pagination/build-paginator'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { platformService } from '../platform/platform.service'
import { userService } from '../user/user-service'
import { UserInvitationEntity } from './user-invitation.entity'

const repo = databaseConnection.getRepository(UserInvitationEntity)
const INVITATION_EXPIREY_DAYS = 1

export const userInvitationsService = {
    async countByProjectId(projectId: string): Promise<number> {
        return repo.countBy({
            projectId,
        })
    },
    async provisionUserInvitation({ email, platformId }: ProvisionUserInvitationParams): Promise<void> {
        const user = await userService.getByPlatformAndEmail({
            email,
            platformId,
        })
        if (isNil(user)) {
            return
        }
        const platform = await platformService.getOneOrThrow(platformId)
        const ONE_DAY_AGO = dayjs().subtract(INVITATION_EXPIREY_DAYS, 'day').toISOString()
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
                    assertEqual(platform.projectRolesEnabled, true, 'Project roles are not enabled', 'PROJECT_ROLES_NOT_ENABLED')
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
    }: CreateParams): Promise<UserInvitationWithLink> {
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
        const invitationLink = await generateInvitationLink(userInvitation)
        await emailService.sendInvitation({
            userInvitation,
            invitationLink,
        })
        const platform = await platformService.getOneOrThrow(platformId)
        if (!smtpEmailSender.isSmtpConfigured(platform)) {
            return {
                ...userInvitation,
                link: invitationLink,
            }
        }
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


async function generateInvitationLink(userInvitation: UserInvitation): Promise<string> {
    const token = await jwtUtils.sign({
        payload: {
            id: userInvitation.id,
        },
        expiresInSeconds: INVITATION_EXPIREY_DAYS * 24 * 60 * 60,
        key: await jwtUtils.getJwtSecret(),
    })

    return platformDomainHelper.constructUrlFrom({
        platformId: userInvitation.platformId,
        path: `invitation?token=${token}&email=${encodeURIComponent(userInvitation.email)}`,
    })
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
