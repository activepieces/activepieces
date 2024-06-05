
import { IsNull } from 'typeorm'
import { databaseConnection } from '../../database/database-connection'
import { jwtUtils } from '../../helper/jwt-utils'
import { UserInvitationEntity } from './invitation.entity'
import { UserInvitation } from '@activepieces/ee-shared'
import { ActivepiecesError, ErrorCode, isNil, PlatformRole } from '@activepieces/shared'

const repo = databaseConnection.getRepository(UserInvitationEntity)

export const userInvitationsService = {
    async create({
        email,
        platformId,
        projectId,
    }: CreateParams): Promise<UserInvitation> {
        const invitation = await repo.findOneBy({
            email,
            platformId,
            projectId: isNil(projectId) ? IsNull() : projectId,
        })
        if (!isNil(invitation)) {
            return invitation
        }
        await repo.upsert({
            email,
            platformId,
            projectId: isNil(projectId) ? undefined : projectId,
        }, ['email', 'platformId', 'projectId'])
        return this.getOneOrThrow({
            email,
            platformId,
            projectId,
        })
    },

    async delete({
        email,
        platformId,
        projectId,
    }: DeleteParams): Promise<void> {
        const invitation = await this.getOneOrThrow({
            email,
            platformId,
            projectId,
        })
        await repo.delete({
            id: invitation.id,
        })
    },

    async getOneOrThrow({
        email,
        platformId,
    }: GetOneByPlatformIdAndEmailParams): Promise<UserInvitation> {
        const invitation = await repo.findOneByOrFail({
            email,
            platformId,
        })
        if (!isNil(invitation)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: `email=${email}, platformId=${platformId}`,
                    entityType: 'UserInvitation',
                },
            })
        }
        return invitation
    },
    async accept({ invitationToken }: AcceptParams): Promise<void> {
        const _invitation = await getByInvitationTokenOrThrow(
            invitationToken,
        )
        
  
        
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
    const userInvitation =  await repo.findOneBy({
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
    projectRole: string | null
}

export type DeleteParams = {
    email: string
    platformId: string
    projectId: string | null
}

export type GetOneByPlatformIdAndEmailParams = {
    email: string
    platformId: string
    projectId: string | null
}
