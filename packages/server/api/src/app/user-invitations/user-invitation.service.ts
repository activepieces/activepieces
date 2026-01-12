import { ActivepiecesError, apId, assertNotNullOrUndefined, ErrorCode, InvitationStatus, InvitationType, isNil, Platform, PlatformRole, SeekPage, spreadIfDefined, User, UserInvitation, UserInvitationWithLink } from '@activepieces/shared'
import { AppSystemProp } from '@activepieces/server-shared'
import { FastifyBaseLogger } from 'fastify'
import { IsNull } from 'typeorm'
import { userIdentityService } from '../authentication/user-identity/user-identity-service'
import { repoFactory } from '../core/db/repo-factory'
import { jwtUtils } from '../helper/jwt-utils'
import { buildPaginator } from '../helper/pagination/build-paginator'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { system } from '../helper/system/system'
import { platformService } from '../platform/platform.service'
import { projectService } from '../project/project-service'
import { userService } from '../user/user-service'
import { UserInvitationEntity } from './user-invitation.entity'

const repo = repoFactory(UserInvitationEntity)

export const userInvitationsService = (log: FastifyBaseLogger) => ({
    async getOneByInvitationTokenOrThrow(invitationToken: string): Promise<UserInvitation> {
        const decodedToken = await jwtUtils.decodeAndVerify<UserInvitationToken>({
            jwt: invitationToken,
            key: await jwtUtils.getJwtSecret(),
        })
        const invitation = await repo().findOneBy({
            id: decodedToken.id,
        })
        if (isNil(invitation)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: `id=${decodedToken.id}`,
                    entityType: 'UserInvitation',
                },
            })
        }
        return invitation
    },
    async provisionUserInvitation({ user, email }: ProvisionUserInvitationParams): Promise<void> {
        const invitations = await repo().createQueryBuilder('user_invitation')
            .where('LOWER("user_invitation"."email") = :email', { email: email.toLowerCase().trim() })
            .andWhere({
                status: InvitationStatus.ACCEPTED,
            })
            .getMany()

        log.info({ count: invitations.length }, '[provisionUserInvitation] list invitations')
        for (const invitation of invitations) {
            log.info({ invitation }, '[provisionUserInvitation] provision')
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
                    // EE project member service removed - project invitations disabled
                    log.info({ invitation }, '[provisionUserInvitation] Project invitations not supported in CE')
                    break
                }
            }
            await repo().delete({
                id: invitation.id,
            })
        }
    },
    async create({
        email,
        platformId,
        projectId,
        type,
        projectRoleId,
        platformRole,
        invitationExpirySeconds,
        status,
    }: CreateParams): Promise<UserInvitationWithLink> {
        const platform = await platformService.getOneOrThrow(platformId)
        const id = apId()
        await repo().upsert({
            id,
            status,
            type,
            email: email.toLowerCase().trim(),
            platformId,
            projectRoleId: type === InvitationType.PLATFORM ? undefined : projectRoleId!,
            platformRole: type === InvitationType.PROJECT ? undefined : platformRole!,
            projectId: type === InvitationType.PLATFORM ? undefined : projectId!,
        }, ['email', 'platformId', 'projectId'])

        const userInvitation = await this.getOneOrThrow({
            id,
            platformId,
        })
        if (status === InvitationStatus.ACCEPTED) {
            await this.accept({
                invitationId: id,
                platformId,
            })
            return userInvitation
        }
        return enrichWithInvitationLink(platform, userInvitation, invitationExpirySeconds, log)
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
        const queryBuilder = repo().createQueryBuilder('user_invitation')
            .where({
                platformId: params.platformId,
                ...spreadIfDefined('projectId', params.projectId),
                ...spreadIfDefined('status', params.status),
                ...spreadIfDefined('type', params.type),
            })
        const { data, cursor } = await paginator.paginate(queryBuilder)
        const enrichedData = data.map((invitation) => {
            return {
                projectRole: null, // EE project role service removed
                ...invitation,
            }
        })
        return paginationHelper.createPage<UserInvitation>(enrichedData, cursor)
    },
    async delete({ id, platformId }: PlatformAndIdParams): Promise<void> {
        const invitation = await this.getOneOrThrow({ id, platformId })
        await repo().delete({
            id: invitation.id,
            platformId,
        })
    },
    async getOneOrThrow({ id, platformId }: PlatformAndIdParams): Promise<UserInvitation> {
        const invitation = await repo().findOne({
            where: {
                id,
                platformId,
            },
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
    async accept({ invitationId, platformId }: AcceptParams): Promise<{ registered: boolean }> {
        const invitation = await this.getOneOrThrow({ id: invitationId, platformId })
        await repo().update(invitation.id, {
            status: InvitationStatus.ACCEPTED,
        })
        const identity = await userIdentityService(log).getIdentityByEmail(invitation.email)
        if (isNil(identity)) {
            return {
                registered: false,
            }
        }
        const user = await userService.getOrCreateWithProject({
            identity,
            platformId: invitation.platformId,
        })
        await this.provisionUserInvitation({
            email: invitation.email,
            user,
        })
        return {
            registered: true,
        }
    },
    async hasAnyAcceptedInvitations({
        email,
        platformId,
    }: HasAnyAcceptedInvitationsParams): Promise<boolean> {
        const invitations = await repo().createQueryBuilder().where({
            platformId,
            status: InvitationStatus.ACCEPTED,
        }).andWhere('LOWER(user_invitation.email) = :email', { email: email.toLowerCase().trim() })
            .getMany()
        return invitations.length > 0
    },
    async getByEmailAndPlatformIdOrThrow({
        email,
        platformId,
        projectId,
    }: GetOneByPlatformIdAndEmailParams): Promise<UserInvitation | null> {
        return repo().findOneBy({
            email,
            platformId,
            projectId: isNil(projectId) ? IsNull() : projectId,
        })
    },
})


async function generateInvitationLink(userInvitation: UserInvitation, expireyInSeconds: number): Promise<string> {
    const token = await jwtUtils.sign({
        payload: {
            id: userInvitation.id,
        },
        expiresInSeconds: expireyInSeconds,
        key: await jwtUtils.getJwtSecret(),
    })
    // Custom domains removed (EE feature) - use FRONTEND_URL
    const publicUrl = system.getOrThrow(AppSystemProp.FRONTEND_URL)
    return `${publicUrl}/invitation?token=${token}&email=${encodeURIComponent(userInvitation.email)}`
}

const enrichWithInvitationLink = async (_platform: Platform, userInvitation: UserInvitation, expireyInSeconds: number, _log: FastifyBaseLogger) => {
    // Email service removed (EE feature) - always return link
    const invitationLink = await generateInvitationLink(userInvitation, expireyInSeconds)
    return {
        ...userInvitation,
        link: invitationLink,
    }
}
type ListUserParams = {
    platformId: string
    type: InvitationType
    projectId: string | null
    status?: InvitationStatus
    limit: number
    cursor: string | null
}

type HasAnyAcceptedInvitationsParams = {
    email: string
    platformId: string
}
type ProvisionUserInvitationParams = {
    user: User
    email: string
}

type PlatformAndIdParams = {
    id: string
    platformId: string
}
export type UserInvitationToken = {
    id: string
}

type AcceptParams = {
    invitationId: string
    platformId: string
}

type CreateParams = {
    email: string
    platformId: string
    platformRole: PlatformRole | null
    projectId: string | null
    status: InvitationStatus
    type: InvitationType
    projectRoleId: string | null
    invitationExpirySeconds: number
}



type GetOneByPlatformIdAndEmailParams = {
    email: string
    platformId: string
    projectId: string | null
}