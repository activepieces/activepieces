import {
    ProjectMemberEntity,
    ProjectMemberSchema,
} from './project-member.entity'
import { databaseConnection } from '../../database/database-connection'
import { userService } from '../../user/user-service'
import { logger } from '../../helper/logger'
import {
    ActivepiecesError,
    ApEdition,
    Cursor,
    ErrorCode,
    ProjectId,
    SeekPage,
    User,
    UserId,
    UserStatus,
    apId,
    isNil,
} from '@activepieces/shared'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import {
    ProjectMember,
    ProjectMemberId,
    ProjectMemberRole,
    ProjectMemberStatus,
    SendInvitationRequest,
} from '@activepieces/ee-shared'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { projectService } from '../../project/project-service'
import { emailService } from '../helper/email-service'
import { projectMembersLimit } from '../../ee/billing/usage/limits/members-limit'
import { getEdition } from '../../helper/secret-helper'

const projectMemberRepo = databaseConnection.getRepository(ProjectMemberEntity)

async function createOrGetUser({ email }: { email: string }): Promise<User> {
    const user = await userService.getOneByEmail({
        email,
    })
    return user ?? await userService.create(
        {
            email,
            password: apId(),
            firstName: 'Unknown',
            lastName: 'Unknown',
            newsLetter: false,
            trackEvents: true,
        },
        UserStatus.SHADOW,
    )
}

export const projectMemberService = {
    async countTeamMembersIncludingOwner(projectId: ProjectId): Promise<number> {
        return await projectMemberRepo.countBy({
            projectId,
        }) + 1
    },
    async send(
        projectId: ProjectId,
        { email, role }: SendInvitationRequest,
    ): Promise<ProjectMember> {
        await projectMembersLimit.limit({
            projectId,
        })
        const invitedUser = await createOrGetUser({ email })
        logger.info(
            `User ${invitedUser.id} invited to project ${projectId} with role ${role}`,
        )
        const invitationId = apId()
        await projectMemberRepo.upsert(
            {
                id: invitationId,
                userId: invitedUser.id,
                projectId,
                role,
                status: getStatusFromEdition(),
            },
            ['projectId', 'userId'],
        )
        const member = await projectMemberRepo.findOneByOrFail({
            id: invitationId,
        })
        emailService.sendInvitationEmail({
            invitationId,
            email,
        }).catch((e) => logger.error(e, '[ProjectMemberService#send] sendemail'))

        return {
            ...member,
            email,
        }
    },
    async accept(invitationId: string): Promise<ProjectMemberSchema> {
        const projectMember = await projectMemberRepo.findOneBy({
            id: invitationId,
        })
        if (isNil(projectMember)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: `Invitation Id ${invitationId} is not found`,
                },
            })
        }
        await projectMemberRepo.update(projectMember.id, {
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
        const queryBuilder = projectMemberRepo
            .createQueryBuilder('project_member')
            .where({ projectId })
        const { data, cursor } = await paginator.paginate(queryBuilder)
        const projectMembers: ProjectMember[] = []
        const project = (await projectService.getOne(projectId))!
        const owner = await userService.getMetaInfo({
            id: project.ownerId,
        })
        projectMembers.push({
            id: apId(),
            userId: project.ownerId,
            email: owner!.email,
            projectId,
            status: ProjectMemberStatus.ACTIVE,
            created: project.created,
            role: ProjectMemberRole.ADMIN,
            updated: project.updated,
        })
        for (const member of data) {
            const usermeta = await userService.getMetaInfo({
                id: member.userId,
            })
            projectMembers.push({
                ...member,
                email: usermeta!.email,
            })
        }
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
        return await projectMemberRepo.find({
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

