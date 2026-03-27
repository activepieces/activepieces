import { apDayjs } from '@activepieces/server-utils'
import {
    apId,
    AppConnectionScope,
    Cursor,
    isNil,
    Metadata,
    PiecesFilterType,
    PlatformId,
    Project,
    ProjectId,
    ProjectType,
    ProjectWithLimits,
    SeekPage,
    spreadIfDefined,
    TeamProjectsLimit,
    UpdateProjectPlatformRequest,
    UserId } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { ArrayContains, Equal, ILike, In, IsNull } from 'typeorm'
import { appConnectionsRepo } from '../../app-connection/app-connection-service/app-connection-service'
import { repoFactory } from '../../core/db/repo-factory'
import { transaction } from '../../core/db/transaction'
import { flowService } from '../../flows/flow/flow.service'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { Order } from '../../helper/pagination/paginator'
import { SystemJobName } from '../../helper/system-jobs/common'
import { systemJobsSchedule } from '../../helper/system-jobs/system-job'
import { platformService } from '../../platform/platform.service'
import { ProjectEntity } from '../../project/project-entity'
import { applyProjectsAccessFilters, projectService } from '../../project/project-service'
import { platformPlanService } from '../platform/platform-plan/platform-plan.service'
import { projectMemberService } from './project-members/project-member.service'
import { ProjectPlanEntity } from './project-plan/project-plan.entity'
import { projectLimitsService } from './project-plan/project-plan.service'
const projectRepo = repoFactory(ProjectEntity)
const projectPlanRepo = repoFactory(ProjectPlanEntity)

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
    async create(params: CreateProjectParams): Promise<ProjectWithLimits> {
        const platformPlan = await platformPlanService(log).getOrCreateForPlatform(params.platformId)
        const platform = await platformService(log).getOneOrThrow(params.platformId)
        const project = await transaction(async (entityManager) => {
            const savedProject = await projectService(log).create({
                ownerId: platform.ownerId,
                displayName: params.displayName,
                platformId: params.platformId,
                externalId: params.externalId,
                metadata: params.metadata,
                maxConcurrentJobs: params.maxConcurrentJobs,
                type: ProjectType.TEAM,
                callPostCreateHooks: false,
                entityManager,
            })

            await projectPlanRepo(entityManager).upsert({
                id: apId(),
                projectId: savedProject.id,
                pieces: [],
                piecesFilterType: PiecesFilterType.NONE,
                locked: false,
                name: 'platform',
            }, ['projectId'])

            if (platformPlan.globalConnectionsEnabled) {
                const connectionExternalIds = params.globalConnectionExternalIds ?? []
                if (connectionExternalIds.length > 0) {
                    await appConnectionsRepo(entityManager)
                        .createQueryBuilder()
                        .update()
                        .set({
                            projectIds: () => 'array_append("projectIds", :projectId)',
                        })
                        .where({
                            externalId: In(connectionExternalIds),
                            platformId: params.platformId,
                            scope: AppConnectionScope.PLATFORM,
                        })
                        .andWhere('NOT ("projectIds" @> ARRAY[:projectId]::varchar[])')
                        .setParameter('projectId', savedProject.id)
                        .execute()
                }
            }
            return savedProject
        })

        await projectService(log).callProjectPostCreateHooks(project)

        return this.getWithPlanAndUsageOrThrow(project.id)
    },
    async update({
        projectId,
        request,
    }: UpdateParams): Promise<ProjectWithLimits> {
        const project = await projectService(log).getOneOrThrow(projectId)
        const platformPlan = await platformPlanService(log).getOrCreateForPlatform(project.platformId)
        const { globalConnectionExternalIds, ...rest } = request
        await transaction(async (entityManager) => {
            await projectService(log).update(projectId, {
                type: project.type,
                ...rest,
            }, entityManager)
            if (platformPlan.globalConnectionsEnabled && globalConnectionExternalIds) {
                const projectGlobalConnections = await appConnectionsRepo(entityManager).find({
                    where: {
                        projectIds: ArrayContains([projectId]),
                        scope: AppConnectionScope.PLATFORM,
                    },
                })
                const existingGlobalConnectionExternalIds = projectGlobalConnections.map(connection => connection.externalId)
                const globalConnectionsToAddProjectTo = globalConnectionExternalIds.filter(externalId => !existingGlobalConnectionExternalIds.includes(externalId)) ?? []
                const globalConnectionsToRemoveProjectFrom = existingGlobalConnectionExternalIds.filter(externalId => !globalConnectionExternalIds?.includes(externalId)) ?? []
                if (globalConnectionsToAddProjectTo.length > 0) {
                    await appConnectionsRepo(entityManager).createQueryBuilder()
                        .update()
                        .set({
                            projectIds: () => 'array_append("projectIds", :projectId)',
                        })
                        .where({
                            platformId: project.platformId,
                            externalId: In(globalConnectionsToAddProjectTo),
                            scope: AppConnectionScope.PLATFORM,
                        })
                        .andWhere('NOT ("projectIds" @> ARRAY[:projectId]::varchar[])')
                        .setParameter('projectId', projectId)
                        .execute()
                }
                if (globalConnectionsToRemoveProjectFrom.length > 0) {
                    await appConnectionsRepo(entityManager).createQueryBuilder()
                        .update()
                        .set({
                            projectIds: () => 'array_remove("projectIds", :projectId)',
                        })
                        .where({
                            platformId: project.platformId,
                            externalId: In(globalConnectionsToRemoveProjectFrom),
                            scope: AppConnectionScope.PLATFORM,
                        })
                        .andWhere('("projectIds" @> ARRAY[:projectId]::varchar[])')
                        .setParameter('projectId', projectId)
                        .execute()
                }
            }
            if (!isNil(request.plan)) {
                const platform = await platformService(log).getOneWithPlanOrThrow(project.platformId)
                if (platform.plan.teamProjectsLimit !== TeamProjectsLimit.NONE) {
                    await projectLimitsService(log).upsert(
                        {
                            ...spreadIfDefined('pieces', request.plan.pieces),
                            ...spreadIfDefined('piecesFilterType', request.plan.piecesFilterType),
                        },
                        projectId,
                        entityManager,
                    )
                }
            }
        })
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
            await this.markForDeletion({ id: personalProject.id, platformId })
        }
    },

    async markForDeletion({ id, platformId }: DeleteProjectParams): Promise<void> {
        await projectRepo().softDelete({ id, platformId })
        await systemJobsSchedule(log).upsertJob({
            job: {
                name: SystemJobName.HARD_DELETE_PROJECT,
                data: {
                    projectId: id,
                    platformId,
                    preDeletedFlowIds: [],
                },
                jobId: `hard-delete-project-${id}`,
            },
            schedule: {
                type: 'one-time',
                date: apDayjs(),
            },
            customConfig: {
                attempts: 25,
                backoff: {
                    type: 'fixed',
                    delay: 60000,
                },
            },
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

type CreateProjectParams = {
    platformId: string
    displayName: string
    externalId?: string
    metadata?: Metadata
    maxConcurrentJobs?: number
    globalConnectionExternalIds?: string[]
}

type DeleteProjectParams = {
    id: ProjectId
    platformId: PlatformId
}