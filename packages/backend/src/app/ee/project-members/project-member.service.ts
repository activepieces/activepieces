import { ProjectMemberEntity, ProjectMemberSchema } from './project-member.entity'
import { databaseConnection } from '../../database/database-connection'
import { userService } from '../../user/user-service'
import {
    ActivepiecesError,
    ApEdition,
    Cursor,
    ErrorCode,
    Principal,
    ProjectId,
    SeekPage,
    UserId,
    apId,
    isNil,
} from '@activepieces/shared'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import {
    PlatformId,
    ProjectMember,
    ProjectMemberId,
    ProjectMemberRole,
    ProjectMemberStatus,
    SendInvitationRequest,
} from '@activepieces/ee-shared'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { projectService } from '../../project/project-service'
import { emailService } from '../helper/email/email-service'
import { projectMembersLimit } from '../billing/limits/members-limit'
import dayjs from 'dayjs'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
import { getEdition } from '../../helper/secret-helper'

const projectMemberRepo = databaseConnection.getRepository(ProjectMemberEntity)

export const projectMemberService = {
    async upsert({ platformId, email, projectId, role, status }: UpsertParams): Promise<ProjectMember> {
        await projectMembersLimit.limit({
            projectId,
        })

        const user = await userService.getByPlatformAndEmail({
            platformId,
            email,
        })

        const projectMember: NewProjectMember = {
            id: apId(),
            updated: dayjs().toISOString(),
            userId: user?.id ?? null,
            email,
            platformId,
            projectId,
            role,
            status: status ?? getStatusFromEdition(),
        }

        const upsertResult = await projectMemberRepo.upsert(projectMember, ['projectId', 'email'])

        return {
            ...projectMember,
            created: upsertResult.generatedMaps[0].created,
        }
    },

    async upsertAndSend({ platformId, projectId, email, role }: SendParams): Promise<UpsertAndSendResponse> {
        const projectMember = await this.upsert({
            platformId,
            email,
            projectId,
            role,
        })

        await emailService.sendInvitation({
            invitationId: projectMember.id,
            projectId,
            email,
            register: isNil(projectMember.userId),
        })

        const invitationToken = await accessTokenManager.generateToken({
            id: projectMember.id,
        } as Principal)

        return {
            projectMember,
            invitationToken,
        }
    },

    async accept({ invitationToken, userId }: AcceptParams): Promise<ProjectMember> {
        const { id: projectMemberId } = await accessTokenManager.extractPrincipal(invitationToken) as ProjectMemberToken
        const projectMember = await getOrThrow(projectMemberId)

        await projectMemberRepo.update(projectMemberId, {
            userId,
            status: ProjectMemberStatus.ACTIVE,
        })

        await userService.verify({
            id: userId,
        })

        return {
            ...projectMember,
            userId,
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
        const queryBuilder = projectMemberRepo
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
            userId: project.ownerId,
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
    async getRole({ userId, projectId }: { projectId: ProjectId, userId: UserId }): Promise<ProjectMemberRole | null> {
        const project = await projectService.getOne(projectId)
        if (project?.ownerId === userId) {
            return ProjectMemberRole.ADMIN
        }
        const member = await projectMemberRepo.findOneBy({
            projectId,
            userId,
        })
        return member?.role ?? null
    },
    async listByUserId(userId: UserId): Promise<ProjectMemberSchema[]> {
        return projectMemberRepo.find({
            where: {
                userId,
            },
        })
    },
    async delete(
        projectId: ProjectId,
        invitationId: ProjectMemberId,
    ): Promise<void> {
        await projectMemberRepo.delete({ projectId, id: invitationId })
    },

    async countTeamMembersIncludingOwner(projectId: ProjectId): Promise<number> {
        return await projectMemberRepo.countBy({
            projectId,
        }) + 1
    },

    async getByInvitationTokenOrThrow(invitationToken: string): Promise<ProjectMember> {
        const { id: projectMemberId } = await accessTokenManager.extractPrincipal(invitationToken) as ProjectMemberToken
        return getOrThrow(projectMemberId)
    },
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
    const projectMember = await projectMemberRepo.findOneBy({
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
    platformId: PlatformId | null
    projectId: ProjectId
    role: ProjectMemberRole
    status?: ProjectMemberStatus
}

type NewProjectMember = Omit<ProjectMember, 'created'>

type SendParams = SendInvitationRequest & {
    projectId: ProjectId
    platformId: PlatformId | null
}

type AcceptParams = {
    invitationToken: string
    userId: UserId
}

type ProjectMemberToken = {
    id: string
}

type UpsertAndSendResponse = {
    projectMember: ProjectMember
    invitationToken: string
}
