import { ActivepiecesError, apId, assertEqual, assertNotNullOrUndefined, ErrorCode, InvitationStatus, InvitationType, isNil, Platform, PlatformRole, SeekPage, spreadIfDefined, User, UserIdentity, UserInvitation, UserInvitationWithLink } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { IsNull } from 'typeorm'
import { userIdentityService } from '../authentication/user-identity/user-identity-service'
import { repoFactory } from '../core/db/repo-factory'
import { domainHelper } from '../ee/custom-domains/domain-helper'
import { smtpEmailSender } from '../ee/helper/email/email-sender/smtp-email-sender'
import { emailService } from '../ee/helper/email/email-service'
import { projectMemberService } from '../ee/projects/project-members/project-member.service'
import { projectRoleService } from '../ee/projects/project-role/project-role.service'
import { jwtUtils } from '../helper/jwt-utils'
import { buildPaginator } from '../helper/pagination/build-paginator'
import { paginationHelper } from '../helper/pagination/pagination-utils'
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
    async provisionUserInvitation({ email }: ProvisionUserInvitationParams): Promise<void> {
        const identity = await userIdentityService(log).getIdentityByEmail(email)
        if (isNil(identity)) {
            return
        }
        const invitations = await repo().createQueryBuilder('user_invitation')
            .where('LOWER("user_invitation"."email") = :email', { email: email.toLowerCase().trim() })
            .andWhere({
                status: InvitationStatus.ACCEPTED,
            })
            .getMany()

        log.info({ count: invitations.length }, '[provisionUserInvitation] list invitations')
        for (const invitation of invitations) {
            log.info({ invitation }, '[provisionUserInvitation] provision')
            const user = await getOrCreateUser(identity, invitation.platformId)
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
                    const platform = await platformService.getOneWithPlanOrThrow(invitation.platformId)
                    assertEqual(platform.plan.projectRolesEnabled, true, 'Project roles are not enabled', 'PROJECT_ROLES_NOT_ENABLED')

                    const projectRole = await projectRoleService.getOneOrThrowById({
                        id: projectRoleId,
                    })

                    const project = await projectService.exists({
                        projectId,
                        isSoftDeleted: false,
                    })
                    if (!isNil(project)) {
                        await projectMemberService(log).upsert({
                            projectId,
                            userId: user.id,
                            projectRoleName: projectRole.name,
                        })
                    }
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
        const enrichedData = await Promise.all(data.map(async (invitation) => {
            return {
                projectRole: !isNil(invitation.projectRoleId) ? await projectRoleService.getOneOrThrowById({
                    id: invitation.projectRoleId,
                }) : null,
                ...invitation,
            }
        }))
        return paginationHelper.createPage<UserInvitation>(await Promise.all(enrichedData), cursor)
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
        await this.provisionUserInvitation({
            email: invitation.email,
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


async function getOrCreateUser(identity: UserIdentity, platformId: string): Promise<User> {
    const user = await userService.getOneByIdentityAndPlatform({
        identityId: identity.id,
        platformId,
    })
    if (isNil(user)) {
        return userService.create({
            identityId: identity.id,
            platformId,
            platformRole: PlatformRole.MEMBER,
        })
    }
    return user
}
async function generateInvitationLink(userInvitation: UserInvitation, expireyInSeconds: number): Promise<string> {
    const token = await jwtUtils.sign({
        payload: {
            id: userInvitation.id,
        },
        expiresInSeconds: expireyInSeconds,
        key: await jwtUtils.getJwtSecret(),
    })

    return domainHelper.getPublicUrl({
        platformId: userInvitation.platformId,
        path: `invitation?token=${token}&email=${encodeURIComponent(userInvitation.email)}`,
    })
}
const enrichWithInvitationLink = async (platform: Platform, userInvitation: UserInvitation, expireyInSeconds: number, log: FastifyBaseLogger) => {
    const invitationLink = await generateInvitationLink(userInvitation, expireyInSeconds)
    if (!smtpEmailSender(log).isSmtpConfigured(platform)) {
        return {
            ...userInvitation,
            link: invitationLink,
        }
    }
    await emailService(log).sendInvitation({
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

type HasAnyAcceptedInvitationsParams = {
    email: string
    platformId: string
}
type ProvisionUserInvitationParams = {
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