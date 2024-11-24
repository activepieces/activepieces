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
    ProjectRole,
    SeekPage,
    UserId,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { repoFactory } from '../../core/db/repo-factory'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'
import { projectRoleService } from '../project-role/project-role.service'
import {
    ProjectMemberEntity,
} from './project-member.entity'

const repo = repoFactory(ProjectMemberEntity)

export const projectMemberService = {
    async upsert({
        userId,
        projectId,
        projectRoleId,
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
            projectRoleId,
        }

        await repo().upsert(projectMember, [
            'projectId',
            'userId',
            'platformId',
        ])

        return await repo().findOneOrFail({
            where: {
                id: projectMemberId,
            },
            relations: ['projectRole'],
        })
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
            .leftJoinAndSelect('project_member.projectRole', 'projectRole')
            .where({ projectId })
        const { data, cursor } = await paginator.paginate(queryBuilder)
        const enrichedData = await Promise.all(
            data.map(async (member) => {
                const enrichedMember = await enrichProjectMemberWithUser(member)
                return {
                    ...enrichedMember,
                    projectRole: member.projectRole,
                }
            }),
        )
        return paginationHelper.createPage<ProjectMemberWithUser>(enrichedData, cursor)
    },
    async getRole({
        userId,
        projectId,
    }: {
        projectId: ProjectId
        userId: UserId
    }): Promise<ProjectRole | null> {
        const project = await projectService.getOneOrThrow(projectId)
        const user = await userService.getOneOrFail({
            id: userId,
        })

        if (user.id === project.ownerId) {
            return projectRoleService.getDefaultRoleByName(ProjectMemberRole.ADMIN)
        }
        if (project.platformId === user.platformId && user.platformRole === PlatformRole.ADMIN) {
            return projectRoleService.getDefaultRoleByName(ProjectMemberRole.ADMIN)
        }
        const member = await repo()
            .createQueryBuilder('project_member')
            .leftJoinAndSelect('project_member.projectRole', 'project_role')
            .where('project_member.projectId = :projectId', { projectId })
            .andWhere('project_member.userId = :userId', { userId })
            .getOne()

        if (!member) {
            return null
        }

        return member.projectRole ?? null
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
    projectRoleId: string
}

type NewProjectMember = Omit<ProjectMember, 'created' | 'projectRole'>

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