import {
    ProjectMember,
    ProjectMemberId,
    ProjectMemberWithUser,
} from '@activepieces/ee-shared'
import {
    ApEdition,
    ApId,
    apId,
    Cursor,
    DefaultProjectRole,
    isNil,
    PlatformId,
    PlatformRole,
    ProjectId,
    ProjectRole,
    SeekPage,
    UserId,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { Equal } from 'typeorm'
import { userIdentityService } from '../../../authentication/user-identity/user-identity-service'
import { repoFactory } from '../../../core/db/repo-factory'
import { buildPaginator } from '../../../helper/pagination/build-paginator'
import { paginationHelper } from '../../../helper/pagination/pagination-utils'
import { system } from '../../../helper/system/system'
import { projectService } from '../../../project/project-service'
import { userService } from '../../../user/user-service'
import { projectRoleService } from '../project-role/project-role.service'
import {
    ProjectMemberEntity,
} from './project-member.entity'
const repo = repoFactory(ProjectMemberEntity)

export const projectMemberService = (log: FastifyBaseLogger) => ({
    async upsert({
        userId,
        projectId,
        projectRoleName,
    }: UpsertParams): Promise<ProjectMember> {
        const { platformId } = await projectService.getOneOrThrow(projectId)
        const existingProjectMember = await repo().findOneBy({
            projectId,
            userId,
            platformId,
        })
        const projectMemberId = existingProjectMember?.id ?? apId()

        const projectRole = await projectRoleService.getOneOrThrow({
            name: projectRoleName,
            platformId,
        })

        const projectMember: NewProjectMember = {
            id: projectMemberId,
            updated: dayjs().toISOString(),
            userId,
            platformId,
            projectId,
            projectRoleId: projectRole.id,
        }

        await repo().upsert(projectMember, [
            'projectId',
            'userId',
            'platformId',
        ])

        return repo().findOneOrFail({
            where: {
                id: projectMemberId,
            },
        })
    },
    async list(
        {
            platformId,
            projectId,
            cursorRequest,
            limit,
            projectRoleId,
        }: ListParams,
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
            .where({ platformId })

        if (projectId) {
            queryBuilder.andWhere({ projectId })
        }

        if (projectRoleId) {
            queryBuilder.andWhere({ projectRoleId })
        }

        const { data, cursor } = await paginator.paginate(queryBuilder)
        const enrichedData: (ProjectMemberWithUser | null)[] = await Promise.all(
            data.map(async (member) => {
                const enrichedMember = await enrichProjectMemberWithUser(member, log)
                if (isNil(enrichedMember)) {
                    return null
                }
                return {
                    ...enrichedMember,
                    projectRole: await projectRoleService.getOneOrThrowById({
                        id: member.projectRoleId,
                    }),
                }
            }),
        )
        const filteredEnrichedData = enrichedData.filter((member) => !isNil(member))
        return paginationHelper.createPage<ProjectMemberWithUser>(filteredEnrichedData, cursor)
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
            return projectRoleService.getOneOrThrow({ name: DefaultProjectRole.ADMIN, platformId: project.platformId })
        }
        if (project.platformId === user.platformId && user.platformRole === PlatformRole.ADMIN) {
            return projectRoleService.getOneOrThrow({ name: DefaultProjectRole.ADMIN, platformId: project.platformId })
        }
        if (project.platformId === user.platformId && user.platformRole === PlatformRole.OPERATOR) {
            return projectRoleService.getOneOrThrow({ name: DefaultProjectRole.OPERATOR, platformId: project.platformId })
        }
        const member = await repo().findOneBy({
            projectId,
            userId,
        })

        if (!member) {
            return null
        }

        const projectRole = await projectRoleService.getOneOrThrowById({
            id: member.projectRoleId,
        })

        return projectRole
    },
    async update(params: UpdateMemberRole): Promise<ProjectMember> {
        const projectRole = await projectRoleService.getOneOrThrow({
            name: params.role,
            platformId: params.platformId,
        })
        await repo().update({
            id: params.id,
            projectId: params.projectId,
        }, {
            projectRoleId: projectRole.id,
        })
        return repo().findOneByOrFail({
            id: params.id,
            projectId: params.projectId,
        })
    },
    async getIdsOfProjects({
        userId,
        platformId,
    }: GetIdsOfProjectsParams): Promise<string[]> {
        const edition = system.getEdition()
        if (edition === ApEdition.COMMUNITY) {
            return []
        }
        const members = await repo().findBy({
            userId,
            platformId: Equal(platformId),
        })
        return members.map((member) => member.projectId)
    },
    async delete(
        projectId: ProjectId,
        invitationId: ProjectMemberId,
    ): Promise<void> {
        await repo().delete({ projectId, id: invitationId })
    },
})

type ListParams = {
    platformId: PlatformId
    projectId?: ProjectId
    cursorRequest: Cursor | null
    limit: number
    projectRoleId?: string
}

type GetIdsOfProjectsParams = {
    userId: UserId
    platformId: PlatformId
}

type UpsertParams = {
    userId: string
    projectId: ProjectId
    projectRoleName: string
}

type NewProjectMember = Omit<ProjectMember, 'created' | 'projectRole'>


type UpdateMemberRole = {
    id: ApId
    projectId: ProjectId
    platformId: PlatformId
    role: string
}

async function enrichProjectMemberWithUser(
    projectMember: ProjectMember,
    log: FastifyBaseLogger,
): Promise<ProjectMemberWithUser | null> {  
    const isProjectSoftDeleted = await projectService.exists({
        projectId: projectMember.projectId,
        isSoftDeleted: true,
    })
    if (isProjectSoftDeleted) {
        return null
    }

    const user = await userService.getOneOrFail({
        id: projectMember.userId,
    })
    const identity = await userIdentityService(log).getBasicInformation(user.identityId)
    const projectRole = await projectRoleService.getOneOrThrowById({
        id: projectMember.projectRoleId,
    })
    const project = await projectService.getOneOrThrow(projectMember.projectId)
    return {
        ...projectMember,
        projectRole,
        project: {
            id: project.id,
            displayName: project.displayName,
        },
        user: {
            platformId: user.platformId,
            platformRole: user.platformRole,
            status: user.status,
            externalId: user.externalId,
            email: identity.email,
            id: user.id,
            firstName: identity.firstName,
            lastName: identity.lastName,
            created: user.created,
            updated: user.updated,
        },
    }
}