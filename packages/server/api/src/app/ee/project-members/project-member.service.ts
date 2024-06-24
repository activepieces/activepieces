import dayjs from 'dayjs'
import { repoFactory } from '../../core/db/repo-factory'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'
import {
    ProjectMemberEntity,
} from './project-member.entity'
import {
    ProjectMember,
    ProjectMemberId,
    ProjectMemberWithUser,
} from '@activepieces/ee-shared'
import {
    apId,
    Cursor,
    PlatformRole,
    ProjectId,
    ProjectMemberRole,
    SeekPage,
    UserId,
} from '@activepieces/shared'

const repo = repoFactory(ProjectMemberEntity)

export const projectMemberService = {
    async upsert({
        userId,
        projectId,
        role,
    }: UpsertParams): Promise<ProjectMember> {
        const { platformId } = await projectService.getOneOrThrow(projectId)
        const existingProjectMember = await repo().findOneBy({
            projectId,
            userId,
            platformId,
        })
        const projectMemberId = existingProjectMember?.id ?? apId()

        const projectMember: NewProjectMember = {
            id: projectMemberId,
            updated: dayjs().toISOString(),
            userId,
            platformId,
            projectId,
            role,
        }

        const upsertResult = await repo().upsert(projectMember, [
            'projectId',
            'userId',
            'platformId',
        ])

        return {
            ...projectMember,
            created: upsertResult.generatedMaps[0].created,
        }
    },
    async list(
        projectId: ProjectId,
        cursorRequest: Cursor | null,
        limit: number,
    ): Promise<SeekPage<ProjectMemberWithUser>> {
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
        const enrichedData = await Promise.all(
            data.map(enrichProjectMemberWithUser),
        )
        return paginationHelper.createPage<ProjectMemberWithUser>(enrichedData, cursor)
    },
    async getRole({
        userId,
        projectId,
    }: {
        projectId: ProjectId
        userId: UserId
    }): Promise<ProjectMemberRole | null> {
        const project = await projectService.getOneOrThrow(projectId)
        const user = await userService.getOneOrFail({
            id: userId,
        })
        if (user.id === project.ownerId) {
            return ProjectMemberRole.ADMIN
        }
        if (project.platformId === user.platformId && user.platformRole === PlatformRole.ADMIN) {
            return ProjectMemberRole.ADMIN
        }
        const member = await repo().findOneBy({
            projectId,
            userId,
        })
        return member?.role ?? null
    },
    async delete(
        projectId: ProjectId,
        invitationId: ProjectMemberId,
    ): Promise<void> {
        await repo().delete({ projectId, id: invitationId })
    },
    async countTeamMembers(projectId: ProjectId): Promise<number> {
        return repo().countBy({ projectId })
    },
}

type UpsertParams = {
    userId: string
    projectId: ProjectId
    role: ProjectMemberRole
}

type NewProjectMember = Omit<ProjectMember, 'created'>

async function enrichProjectMemberWithUser(
    projectMember: ProjectMember,
): Promise<ProjectMemberWithUser> {
    const user = await userService.getOneOrFail({
        id: projectMember.userId,
    })
    return {
        ...projectMember,
        user: {
            platformId: user.platformId,
            platformRole: user.platformRole,
            email: user.email,
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
        },
    }
}