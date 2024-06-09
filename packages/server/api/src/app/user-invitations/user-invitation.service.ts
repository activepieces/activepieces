
import dayjs from 'dayjs'
import { IsNull, MoreThanOrEqual } from 'typeorm'

import { databaseConnection } from '../database/database-connection'
import { emailService } from '../ee/helper/email/email-service'
import { projectMemberService } from '../ee/project-members/project-member.service'
import { jwtUtils } from '../helper/jwt-utils'
import { userService } from '../user/user-service'
import { UserInvitationEntity } from './user-invitation.entity'
import { ActivepiecesError, apId, assertNotNullOrUndefined, ErrorCode, InvitationStatus, InvitationType, isNil, PlatformRole, UserInvitation } from '@activepieces/shared'

const repo = databaseConnection.getRepository(UserInvitationEntity)

export const userInvitationsService = {
    provisionUserInvitation: async ({ email, platformId }: ProvisionUserInvitationParams): Promise<void> => {
        const user = await userService.getByPlatformAndEmail({
            email,
            platformId,
        })
        if (isNil(user)) {
            return
        }
        const SEVER_DAYS_AGO = dayjs().subtract(7, 'day').toISOString()
        const invitations = await repo.findBy([
            {
                email,
                platformId,
                status: InvitationStatus.ACCEPTED,
                created: MoreThanOrEqual(SEVER_DAYS_AGO),
            },
        ])
        for (const invitation of invitations) {
            switch (invitation.type) {
                case InvitationType.PLATFORM: {
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
        }
    },
    async create({
        email,
        platformId,
        projectId,
        type,
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
            projectId: isNil(projectId) ? undefined : projectId,
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
    async accept({ invitationToken }: AcceptParams): Promise<void> {
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
    platformRole: PlatformRole
    projectId: string | null
    type: InvitationType
    projectRole: string | null
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
