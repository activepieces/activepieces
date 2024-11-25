import { logger } from '@activepieces/server-shared'
import { ActivepiecesError, ApId, apId, assertEqual, assertNotNullOrUndefined, ErrorCode, InvitationStatus, InvitationType, isNil, Platform, PlatformRole, SeekPage, spreadIfDefined, UserInvitation, UserInvitationWithLink } from '@activepieces/shared'
import { IsNull } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { smtpEmailSender } from '../ee/helper/email/email-sender/smtp-email-sender'
import { emailService } from '../ee/helper/email/email-service'
import { platformDomainHelper } from '../ee/helper/platform-domain-helper'
import { projectMemberService } from '../ee/project-members/project-member.service'
import { projectRoleService } from '../ee/project-role/project-role.service'
import { jwtUtils } from '../helper/jwt-utils'
import { buildPaginator } from '../helper/pagination/build-paginator'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { platformService } from '../platform/platform.service'
import { userService } from '../user/user-service'
import { UserInvitationEntity } from './user-invitation.entity'

const repo = repoFactory(UserInvitationEntity)

export const userInvitationsService = {
    async countByProjectId(projectId: string): Promise<number> {
        return repo().countBy({
            projectId,
        })
    },
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
    async provisionUserInvitation({ email, platformId }: ProvisionUserInvitationParams): Promise<void> {
        const user = await userService.getByPlatformAndEmail({
            email,
            platformId,
        })
        logger.info({
            email,
            platformId,
        }, '[provisionUserInvitation]')
        if (isNil(user)) {
            return
        }
        const platform = await platformService.getOneOrThrow(platformId)
        const invitations = await repo().createQueryBuilder('user_invitation')
            .where('LOWER("user_invitation"."email") = :email', { email: email.toLowerCase().trim() })
            .andWhere({
                platformId,
                status: InvitationStatus.ACCEPTED,
            })
            .getMany()

        logger.info({
            platformId,
            count: invitations.length,
        }, '[provisionUserInvitation] list invitations')
        for (const invitation of invitations) {
            logger.info({
                invitation,
            }, '[provisionUserInvitation] provision')
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
                    const { projectId, projectRoleId } = invitation
                    assertNotNullOrUndefined(projectId, 'projectId')
                    assertNotNullOrUndefined(projectRoleId, 'projectRoleId')
                    assertEqual(platform.projectRolesEnabled, true, 'Project roles are not enabled', 'PROJECT_ROLES_NOT_ENABLED')

                    const projectRole = await projectRoleService.getOneOrThrowById({
                        id: projectRoleId,
                    })
                    
                    await projectMemberService.upsert({
                        projectId,
                        userId: user.id,
                        projectRoleName: projectRole.name,
                    })
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
        return enrichWithInvitationLink(platform, userInvitation, invitationExpirySeconds)
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
        return paginationHelper.createPage<UserInvitation>(data, cursor)
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
}


async function generateInvitationLink(userInvitation: UserInvitation, expireyInSeconds: number): Promise<string> {
    const token = await jwtUtils.sign({
        payload: {
            id: userInvitation.id,
        },
        expiresInSeconds: expireyInSeconds,
        key: await jwtUtils.getJwtSecret(),
    })

    return platformDomainHelper.constructUrlFrom({
        platformId: userInvitation.platformId,
        path: `invitation?token=${token}&email=${encodeURIComponent(userInvitation.email)}`,
    })
}
const enrichWithInvitationLink = async (platform: Platform, userInvitation: UserInvitation, expireyInSeconds: number) => {
    const invitationLink = await generateInvitationLink(userInvitation, expireyInSeconds)
    if (!smtpEmailSender.isSmtpConfigured(platform)) {
        return {
            ...userInvitation,
            link: invitationLink,
        }
    }
    await emailService.sendInvitation({
        userInvitation,
        invitationLink,
    })
    return userInvitation
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
    projectRoleId: ApId | null
    invitationExpirySeconds: number
}



type GetOneByPlatformIdAndEmailParams = {
    email: string
    platformId: string
    projectId: string | null
}