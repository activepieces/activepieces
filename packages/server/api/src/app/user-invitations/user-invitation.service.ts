import { ActivepiecesError, apId, assertEqual, assertNotNullOrUndefined, ErrorCode, isNil, SeekPage, spreadIfDefined } from '@activepieces/core-utils'
import { InvitationStatus, InvitationType, PlatformRole, UserInvitation, UserInvitationWithLink } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager, IsNull } from 'typeorm'
import { userIdentityService } from '../authentication/user-identity/user-identity-service'
import { repoFactory } from '../core/db/repo-factory'
import { smtpEmailSender } from '../ee/helper/email/email-sender/smtp-email-sender'
import { emailService } from '../ee/helper/email/email-service'
import { projectMemberService } from '../ee/projects/project-members/project-member.service'
import { projectRoleService } from '../ee/projects/project-role/project-role.service'
import { domainHelper } from '../helper/domain-helper'
import { JwtAudience, jwtUtils } from '../helper/jwt-utils'
import { buildPaginator } from '../helper/pagination/build-paginator'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { platformService } from '../platform/platform.service'
import { projectService } from '../project/project-service'
import { userService } from '../user/user-service'
import { UserInvitationEntity } from './user-invitation.entity'

export const userInvitationRepo = repoFactory(UserInvitationEntity)
const repo = userInvitationRepo

export const userInvitationsService = (log: FastifyBaseLogger) => ({
    async getOneByInvitationTokenOrThrow(invitationToken: string): Promise<UserInvitation> {
        const decodedToken = await jwtUtils.decodeAndVerify<UserInvitationToken>({
            jwt: invitationToken,
            key: await jwtUtils.getJwtSecret(),
            audience: JwtAudience.USER_INVITATION,
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
        const invitations = await repo().createQueryBuilder('user_invitation')
            .where('LOWER("user_invitation"."email") = :email', { email: email.toLowerCase().trim() })
            .andWhere({
                status: InvitationStatus.ACCEPTED,
            })
            .getMany()

        if (invitations.length === 0) return

        const identity = await userIdentityService(log).getIdentityByEmail(email)
        if (isNil(identity)) return

        log.info({ count: invitations.length }, '[provisionUserInvitation] list invitations')
        for (const invitation of invitations) {
            log.info({ invitation }, '[provisionUserInvitation] provision')
            const user = await userService(log).getOrCreateWithProject({
                identity,
                platformId: invitation.platformId,
            })
            switch (invitation.type) {
                case InvitationType.PLATFORM: {
                    assertNotNullOrUndefined(invitation.platformRole, 'platformRole')
                    await userService(log).update({
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
                    const platform = await platformService(log).getOneWithPlanOrThrow(invitation.platformId)
                    assertEqual(platform.plan.projectRolesEnabled, true, 'Project roles are not enabled', 'PROJECT_ROLES_NOT_ENABLED')

                    const projectRole = await projectRoleService.getOneOrThrowById({
                        id: projectRoleId,
                    })

                    const project = await projectService(log).exists({
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
    async createInvitationRecord({
        email,
        platformId,
        projectId,
        type,
        projectRoleId,
        platformRole,
        status,
        entityManager,
    }: CreateInvitationRecordParams): Promise<UserInvitation> {
        const id = apId()
        await repo(entityManager).upsert({
            id,
            status,
            type,
            email: email.toLowerCase().trim(),
            platformId,
            projectRoleId: type === InvitationType.PLATFORM ? undefined : projectRoleId!,
            platformRole: type === InvitationType.PROJECT ? undefined : platformRole!,
            projectId: type === InvitationType.PLATFORM ? undefined : projectId!,
        }, ['email', 'platformId', 'projectId'])

        return this.getOneOrThrow({
            id,
            platformId,
            entityManager,
        })
    },
    async finalizeInvitation({
        userInvitation,
        invitationExpirySeconds,
    }: FinalizeInvitationParams): Promise<UserInvitationWithLink> {
        if (userInvitation.status === InvitationStatus.ACCEPTED) {
            await this.accept({
                invitationId: userInvitation.id,
                platformId: userInvitation.platformId,
            })
            if (smtpEmailSender(log).isSmtpConfigured()) {
                await emailService(log).sendProjectMemberAdded({
                    userInvitation,
                })
            }
            return userInvitation
        }
        return enrichWithInvitationLink(userInvitation, invitationExpirySeconds, log)
    },
    async wouldAddNewUser({ email, platformId }: { email: string, platformId: string }): Promise<boolean> {
        const identity = await userIdentityService(log).getIdentityByEmail(email)
        if (isNil(identity)) {
            return true
        }
        const existingUser = await userService(log).getOneByIdentityAndPlatform({ identityId: identity.id, platformId })
        return isNil(existingUser)
    },
    async countAdditionalSeatsNeeded({
        email,
        platformId,
        entityManager,
    }: CountAdditionalSeatsNeededParams): Promise<number> {
        const addsNewUser = await this.wouldAddNewUser({ email, platformId })
        if (!addsNewUser) {
            return 0
        }
        const alreadyReserved = await repo(entityManager)
            .createQueryBuilder('invitation')
            .where('invitation.platformId = :platformId', { platformId })
            .andWhere('LOWER(invitation.email) = :email', { email: email.toLowerCase().trim() })
            .andWhere('invitation.status IN (:...statuses)', { statuses: [InvitationStatus.PENDING, InvitationStatus.ACCEPTED] })
            .andWhere('invitation.created > :expiryCutoff', { expiryCutoff: getInvitationExpiryCutoff() })
            .getExists()
        return alreadyReserved ? 0 : 1
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
    async getOneOrThrow({ id, platformId, entityManager }: PlatformAndIdParams): Promise<UserInvitation> {
        const invitation = await repo(entityManager).findOne({
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
    async accept({ invitationId, platformId }: AcceptParams): Promise<void> {
        const invitation = await this.getOneOrThrow({ id: invitationId, platformId })
        await repo().update(invitation.id, {
            status: InvitationStatus.ACCEPTED,
        })
        const identity = await userIdentityService(log).getIdentityByEmail(invitation.email)
        if (isNil(identity)) {
            return
        }
        await this.provisionUserInvitation({
            email: invitation.email,
        })
    },
    async hasAnyAcceptedInvitationsForEmail({ email }: { email: string }): Promise<boolean> {
        const count = await repo().createQueryBuilder('user_invitation')
            .where('LOWER("user_invitation"."email") = :email', { email: email.toLowerCase().trim() })
            .andWhere({ status: InvitationStatus.ACCEPTED })
            .getCount()
        return count > 0
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

export const INVITATION_EXPIRY_SECONDS = dayjs.duration(7, 'days').asSeconds()

export function getInvitationExpiryCutoff(): string {
    return dayjs().subtract(INVITATION_EXPIRY_SECONDS, 'seconds').toISOString()
}

async function generateInvitationLink(userInvitation: UserInvitation, expireyInSeconds: number): Promise<string> {
    const token = await jwtUtils.sign({
        payload: {
            id: userInvitation.id,
        },
        expiresInSeconds: expireyInSeconds,
        key: await jwtUtils.getJwtSecret(),
        audience: JwtAudience.USER_INVITATION,
    })

    return domainHelper.getPublicUrl({
        path: `invitation?token=${token}&email=${encodeURIComponent(userInvitation.email)}`,
    })
}
const enrichWithInvitationLink = async (userInvitation: UserInvitation, expireyInSeconds: number, log: FastifyBaseLogger) => {
    const invitationLink = await generateInvitationLink(userInvitation, expireyInSeconds)
    if (!smtpEmailSender(log).isSmtpConfigured()) {
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
    entityManager?: EntityManager
}
export type UserInvitationToken = {
    id: string
}

type AcceptParams = {
    invitationId: string
    platformId: string
}

export type CreateInvitationRecordParams = {
    email: string
    platformId: string
    platformRole: PlatformRole | null
    projectId: string | null
    status: InvitationStatus
    type: InvitationType
    projectRoleId: string | null
    entityManager?: EntityManager
}

export type FinalizeInvitationParams = {
    userInvitation: UserInvitation
    invitationExpirySeconds: number
}

export type CountAdditionalSeatsNeededParams = {
    email: string
    platformId: string
    entityManager?: EntityManager
}

type GetOneByPlatformIdAndEmailParams = {
    email: string
    platformId: string
    projectId: string | null
}
