import dayjs from 'dayjs'
import { EntityManager, IsNull } from 'typeorm'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
import { repoFactory } from '../../core/db/repo-factory'
import { jwtUtils } from '../../helper/jwt-utils'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { getEdition } from '../../helper/secret-helper'
import { projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'
import { emailService } from '../helper/email/email-service'
import { projectMembersLimit } from '../project-plan/members-limit'
import {
    ProjectMemberEntity,
    ProjectMemberSchema,
} from './project-member.entity'
import {
    AddProjectMemberRequestBody,
    ProjectMember,
    ProjectMemberId,
    ProjectMemberStatus,
} from '@activepieces/ee-shared'
import {
    ActivepiecesError,
    ApEdition,
    apId,
    Cursor,
    ErrorCode,
    isNil,
    PlatformId,
    Principal,
    ProjectId,
    ProjectMemberRole,
    SeekPage,
    UserId,
} from '@activepieces/shared'

const repo = repoFactory(ProjectMemberEntity)

export const projectMemberService = {
    async upsert({
        email,
        projectId,
        role,
        status,
    }: UpsertParams): Promise<ProjectMember> {
        await projectMembersLimit.limit({
            projectId,
        })

        const project = await projectService.getOneOrThrow(projectId)
        const platformId = project.platformId ?? null
        const existingProjectMember = await repo().findOneBy({
            projectId,
            email,
            platformId: isNil(platformId) ? IsNull() : platformId,
        })
        const projectMemberId = existingProjectMember?.id ?? apId()

        const projectMember: NewProjectMember = {
            id: projectMemberId,
            updated: dayjs().toISOString(),
            email,
            platformId,
            projectId,
            role,
            status: status ?? getStatusFromEdition(),
        }

        const upsertResult = await repo().upsert(projectMember, [
            'projectId',
            'email',
            'platformId',
        ])

        return {
            ...projectMember,
            created: upsertResult.generatedMaps[0].created,
        }
    },

    async upsertAndSend({
        projectId,
        email,
        role,
        status,
    }: UpsertAndSendParams): Promise<UpsertAndSendResponse> {
        const projectMember = await this.upsert({
            email,
            projectId,
            role,
            status,
        })

        if (projectMember.status === ProjectMemberStatus.PENDING) {
            await emailService.sendInvitation({
                invitationId: projectMember.id,
                projectId,
                email,
            })
        }

        const invitationToken = await accessTokenManager.generateToken({
            id: projectMember.id,
        } as Principal)

        return {
            projectMember,
            invitationToken,
        }
    },

    async accept({ invitationToken }: AcceptParams): Promise<ProjectMember> {
        const { id: projectMemberId } = await getByInvitationTokenOrThrow(
            invitationToken,
        )
        const projectMember = await getOrThrow(projectMemberId)

        await repo().update(projectMemberId, {
            status: ProjectMemberStatus.ACTIVE,
        })
        return {
            ...projectMember,
            status: ProjectMemberStatus.ACTIVE,
        }
    },

    async list(
        projectId: ProjectId,
        cursorRequest: Cursor | null,
        limit: number,
    ): Promise<SeekPage<ProjectMember>> {
        const decodedCursor = paginationHelper.decodeCursor(cursorRequest)
        const paginator = buildPaginator({
            entity: ProjectMemberEntity,
            query: {
                limit,
                order: 'ASC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })
        const queryBuilder = repo()
            .createQueryBuilder('project_member')
            .where({ projectId })
        const { data, cursor } = await paginator.paginate(queryBuilder)
        const projectMembers: ProjectMember[] = []
        const project = await projectService.getOneOrThrow(projectId)
        const owner = await userService.getMetaInfo({
            id: project.ownerId,
        })

        projectMembers.push({
            id: apId(),
            email: owner!.email,
            platformId: project.platformId ?? null,
            projectId,
            status: ProjectMemberStatus.ACTIVE,
            created: project.created,
            role: ProjectMemberRole.ADMIN,
            updated: project.updated,
        })

        projectMembers.push(...data)
        return paginationHelper.createPage<ProjectMember>(projectMembers, cursor)
    },
    async getRole({
        userId,
        projectId,
    }: {
        projectId: ProjectId
        userId: UserId
    }): Promise<ProjectMemberRole | null> {
        const project = await projectService.getOne(projectId)
        if (project?.ownerId === userId) {
            return ProjectMemberRole.ADMIN
        }
        const user = await userService.getMetaInfo({
            id: userId,
        })
        const member = await repo().findOneBy({
            projectId,
            email: user?.email,
            platformId: isNil(user?.platformId) ? IsNull() : user?.platformId,
        })
        return member?.role ?? null
    },
    async listByUser({
        email,
        platformId,
    }: {
        email: string
        platformId: null | string
    }): Promise<ProjectMemberSchema[]> {
        return repo()
            .createQueryBuilder('pm')
            .innerJoinAndSelect('pm.project', 'project')
            .where('pm.email = :email', { email })
            .andWhere('pm.status = :status', { status: ProjectMemberStatus.ACTIVE })
            .andWhere(platformId ? 'pm."platformId" = :platformId' : 'pm."platformId" IS NULL', { platformId })
            .andWhere('project.deleted IS NULL')
            .getMany()
    },
    async delete(
        projectId: ProjectId,
        invitationId: ProjectMemberId,
    ): Promise<void> {
        await repo().delete({ projectId, id: invitationId })
    },
    async countTeamMembersIncludingOwner(projectId: ProjectId): Promise<number> {
        return (
            (await repo().countBy({
                projectId,
            })) + 1
        )
    },

    async deleteAllByPlatformAndEmail({ email, platformId, entityManager }: DeleteAllByPlatformAndEmailParams): Promise<void> {
        await repo(entityManager).delete({
            email,
            platformId,
        })
    },
}

async function getByInvitationTokenOrThrow(
    invitationToken: string,
): Promise<ProjectMember> {
    const { id: projectMemberId } =
        await jwtUtils.decodeAndVerify<ProjectMemberToken>({
            jwt: invitationToken,
            key: await jwtUtils.getJwtSecret(),
        })
    return getOrThrow(projectMemberId)
}

function getStatusFromEdition(): ProjectMemberStatus {
    const edition = getEdition()
    switch (edition) {
        case ApEdition.CLOUD:
            return ProjectMemberStatus.PENDING
        case ApEdition.ENTERPRISE:
            return ProjectMemberStatus.ACTIVE
        default:
            throw new Error('Unnkown project status ' + edition)
    }
}

const getOrThrow = async (id: string): Promise<ProjectMember> => {
    const projectMember = await repo().findOneBy({
        id,
    })

    if (isNil(projectMember)) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                message: `Project Member Id ${id} is not found`,
            },
        })
    }

    return projectMember
}

type UpsertParams = {
    email: string
    projectId: ProjectId
    role: ProjectMemberRole
    status?: ProjectMemberStatus
}

type NewProjectMember = Omit<ProjectMember, 'created'>

type UpsertAndSendParams = AddProjectMemberRequestBody & {
    projectId: ProjectId
}

type AcceptParams = {
    invitationToken: string
}

export type ProjectMemberToken = {
    id: string
}

type UpsertAndSendResponse = {
    projectMember: ProjectMember
    invitationToken: string
}

type DeleteAllByPlatformAndEmailParams = {
    email: string
    platformId: PlatformId
    entityManager?: EntityManager
}
