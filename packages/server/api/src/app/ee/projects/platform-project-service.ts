import {
    UpdateProjectPlatformRequest,
} from '@activepieces/ee-shared'
import {
    Cursor,
    isNil,
    PlatformId,
    Project,
    ProjectId,
    ProjectType,
    ProjectWithLimits,
    SeekPage,
    spreadIfDefined,
    TeamProjectsLimit,
    UserId,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Equal, ILike, In, IsNull } from 'typeorm'
import { appConnectionService } from '../../app-connection/app-connection-service/app-connection-service'
import { repoFactory } from '../../core/db/repo-factory'
import { transaction } from '../../core/db/transaction'
import { flowRepo } from '../../flows/flow/flow.repo'
import { flowService } from '../../flows/flow/flow.service'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { Order } from '../../helper/pagination/paginator'
import { platformService } from '../../platform/platform.service'
import { ProjectEntity } from '../../project/project-entity'
import { applyProjectsAccessFilters, projectService } from '../../project/project-service'
import { projectMemberService } from './project-members/project-member.service'
import { projectLimitsService } from './project-plan/project-plan.service'
const projectRepo = repoFactory(ProjectEntity)

export const platformProjectService = (log: FastifyBaseLogger) => ({
    async getForPlatform(params: GetAllForParamsAndUser): Promise<SeekPage<ProjectWithLimits>> {
        const { cursorRequest, limit, platformId, displayName, externalId, userId, types, isPrivileged } = params

        const decodedCursor = paginationHelper.decodeCursor(cursorRequest)
        const paginator = buildPaginator({
            entity: ProjectEntity,
            query: {
                limit,
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
                orderBy: [
                    { field: 'type', order: Order.ASC },
                    { field: 'displayName', order: Order.ASC },
                    { field: 'id', order: Order.ASC },
                ],
            },
        })

        const filters = {
            platformId: Equal(platformId),
            ...spreadIfDefined('displayName', displayName ? ILike(`%${displayName}%`) : undefined),
            ...spreadIfDefined('externalId', externalId),
            ...(types && types.length > 0 ? { type: In(types) } : {}),
            deleted: IsNull(),
        }

        const queryBuilder = projectRepo()
            .createQueryBuilder('project')
            .where(filters)

        await applyProjectsAccessFilters(queryBuilder, { platformId, userId, isPrivileged })

        const { data, cursor } = await paginator.paginate(queryBuilder)
        const projects: ProjectWithLimits[] = await enrichProjects(data, log)
        return paginationHelper.createPage<ProjectWithLimits>(projects, cursor)
    },
    async update({
        projectId,
        request,
    }: UpdateParams): Promise<ProjectWithLimits> {
        const project = await projectService.getOneOrThrow(projectId)
        await projectService.update(projectId, {
            type: project.type,
            ...request,
        })
        if (!isNil(request.plan)) {
            const platform = await platformService.getOneWithPlanOrThrow(project.platformId)
            if (platform.plan.teamProjectsLimit !== TeamProjectsLimit.NONE) {
                await projectLimitsService(log).upsert(
                    {
                        ...spreadIfDefined('pieces', request.plan.pieces),
                        ...spreadIfDefined('piecesFilterType', request.plan.piecesFilterType),
                    },
                    projectId,
                )
            }
        }
        return this.getWithPlanAndUsageOrThrow(projectId)
    },
    async getWithPlanAndUsageOrThrow(
        projectId: string,
    ): Promise<ProjectWithLimits> {
        const project = await projectRepo().findOneByOrFail({
            id: projectId,
        })
        return (await enrichProjects([project], log))[0]
    },
    async deletePersonalProjectForUser({ userId, platformId }: DeletePersonalProjectForUserParams): Promise<void> {
        const personalProject = await projectRepo().findOneBy({
            platformId,
            ownerId: userId,
            type: ProjectType.PERSONAL,
        })
        if (!isNil(personalProject)) {
            await this.hardDelete({ id: personalProject.id, platformId })
        }
    },

    async hardDelete({ id, platformId }: HardDeleteParams): Promise<void> {
        await transaction(async (entityManager) => {
            const allFlows = await flowRepo(entityManager).find({
                where: {
                    projectId: id,
                },
                select: {
                    id: true,
                },
            })
            await Promise.all(allFlows.map((flow) => flowService(log).delete({ id: flow.id, projectId: id })))
            await appConnectionService(log).deleteAllProjectConnections(id)
            await projectRepo(entityManager).delete({
                id,
                platformId,
            })
        })

    },
})

async function enrichProjects(
    projects: Project[],
    log: FastifyBaseLogger,
): Promise<ProjectWithLimits[]> {
    if (projects.length === 0) return []
    
    const projectIds = projects.map(p => p.id)
    
    const [totalUsersMap, activeUsersMap, totalFlowsMap, activeFlowsMap, plansMap] = await Promise.all([
        projectMemberService(log).countTotalUsersByProjects(projectIds),
        projectMemberService(log).countActiveUsersByProjects(projectIds),
        flowService(log).countFlowsByProjects(projectIds),
        flowService(log).countActiveFlowsByProjects(projectIds),
        projectLimitsService(log).getOrCreateDefaultPlansForProjects(projectIds),
    ])

    return projects.map(project => {
        return {
            ...project,
            plan: plansMap.get(project.id)!,
            analytics: {
                activeFlows: activeFlowsMap.get(project.id) ?? 0,
                totalFlows: totalFlowsMap.get(project.id) ?? 0,
                totalUsers: totalUsersMap.get(project.id) ?? 0,
                activeUsers: activeUsersMap.get(project.id) ?? 0,
            },
        }
    })
}


type GetAllForParamsAndUser = {
    userId: string
    platformId: string
    displayName?: string
    externalId?: string
    cursorRequest: Cursor | null
    limit: number
    types?: ProjectType[]
    isPrivileged: boolean
}

type DeletePersonalProjectForUserParams = {
    userId: UserId
    platformId: PlatformId
}

type UpdateParams = {
    projectId: ProjectId
    request: UpdateProjectPlatformRequest
    platformId?: PlatformId
}

type HardDeleteParams = {
    id: ProjectId
    platformId: PlatformId
}