import {
    UpdateProjectPlatformRequest,
} from '@activepieces/ee-shared'
import {
    ActivepiecesError,
    assertNotNullOrUndefined,
    Cursor,
    EndpointScope,
    ErrorCode,
    FlowStatus,
    isNil,
    PlatformId,
    Project,
    ProjectId,
    ProjectType,
    ProjectWithLimits,
    SeekPage,
    spreadIfDefined,
    TeamProjectsLimit,
    UserStatus,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager, Equal, ILike, In } from 'typeorm'
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
import { projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'
import { ProjectMemberEntity } from './project-members/project-member.entity'
import { projectLimitsService } from './project-plan/project-plan.service'
const projectRepo = repoFactory(ProjectEntity)
const projectMemberRepo = repoFactory(ProjectMemberEntity)

export const platformProjectService = (log: FastifyBaseLogger) => ({
    async getAllForPlatform(params: GetAllForParamsAndUser): Promise<SeekPage<ProjectWithLimits>> {
        const user = await userService.getOneOrFail({
            id: params.userId,
        })
        assertNotNullOrUndefined(user.platformId, 'platformId is undefined')
        const projects = await projectService.getAllForUser({
            platformId: user.platformId,
            userId: params.userId,
            displayName: params.displayName,
            scope: params.scope,
        })
        return getProjects({
            ...params,
            projectIds: projects.map((project) => project.id),
        }, log)
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
        return enrichProject(
            await projectRepo().findOneByOrFail({
                id: projectId,
            }),
            log,
        )
    },


    async hardDelete({ id, platformId }: HardDeleteParams): Promise<void> {
        await transaction(async (entityManager) => {
            await assertAllProjectFlowsAreDisabled({
                projectId: id,
                entityManager,
            }, log)

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
            await projectRepo().delete({
                id,
                platformId,
            })
        })

    },
})

async function getProjects(params: GetAllParams & { projectIds?: string[] }, log: FastifyBaseLogger): Promise<SeekPage<ProjectWithLimits>> {
    const { cursorRequest, limit, platformId, displayName, externalId, projectIds, types } = params
    const decodedCursor = paginationHelper.decodeCursor(cursorRequest)
    const paginator = buildPaginator({
        entity: ProjectEntity,
        query: {
            limit,
            afterCursor: decodedCursor.nextCursor,
            beforeCursor: decodedCursor.previousCursor,
            orderBy: [
                {
                    field: 'type',
                    order: Order.ASC,
                },
                {
                    field: 'displayName',
                    order: Order.ASC,
                },
                {
                    field: 'id',
                    order: Order.ASC,
                },
            ],
        },
    })
    const displayNameFilter = displayName ? ILike(`%${displayName}%`) : undefined
    const filters = {
        platformId: Equal(platformId),
        ...spreadIfDefined('externalId', externalId),
        ...spreadIfDefined('displayName', displayNameFilter),
        ...(projectIds ? { id: In(projectIds) } : {}),
        ...(types ? { type: In(types) } : {}),
    }

    const queryBuilder = projectRepo()
        .createQueryBuilder('project')
        .leftJoinAndMapOne(
            'project.plan',
            'project_plan',
            'project_plan',
            'project.id = "project_plan"."projectId"',
        )
        .where(filters)
        .groupBy('project.id')
        .addGroupBy('"project_plan"."id"')

    const { data, cursor } = await paginator.paginate(queryBuilder)
    const projects: ProjectWithLimits[] = await Promise.all(
        data.map((project) => enrichProject(project, log)),
    )
    return paginationHelper.createPage<ProjectWithLimits>(projects, cursor)
}

type GetAllForParamsAndUser = {
    userId: string
    scope?: EndpointScope
} & GetAllParams

type GetAllParams = {
    platformId: string
    displayName?: string
    externalId?: string
    cursorRequest: Cursor | null
    limit: number
    types?: ProjectType[]
}

async function enrichProject(
    project: Project,
    log: FastifyBaseLogger,
): Promise<ProjectWithLimits> {
    const totalUsers = await projectMemberRepo().countBy({
        projectId: project.id,
    })
    const activeUsers = await projectMemberRepo()
        .createQueryBuilder('project_member')
        .leftJoin('user', 'user', 'user.id = project_member."userId"')
        .groupBy('user.id')
        .where('user.status = :activeStatus and project_member."projectId" = :projectId', {
            activeStatus: UserStatus.ACTIVE,
            projectId: project.id,
        })
        .getCount()

    const totalFlows = await flowService(log).count({
        projectId: project.id,
    })

    const activeFlows = await flowService(log).count({
        projectId: project.id,
        status: FlowStatus.ENABLED,
    })


    return {
        ...project,
        plan: await projectLimitsService(log).getOrCreateDefaultPlan(
            project.id,
        ),
        analytics: {
            activeFlows,
            totalFlows,
            totalUsers,
            activeUsers,
        },
    }
}

const assertAllProjectFlowsAreDisabled = async (
    params: AssertAllProjectFlowsAreDisabledParams,
    log: FastifyBaseLogger,
): Promise<void> => {
    const { projectId, entityManager } = params

    const projectHasEnabledFlows = await flowService(log).existsByProjectAndStatus({
        projectId,
        status: FlowStatus.ENABLED,
        entityManager,
    })

    if (projectHasEnabledFlows) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: 'PROJECT_HAS_ENABLED_FLOWS',
            },
        })
    }
}

type UpdateParams = {
    projectId: ProjectId
    request: UpdateProjectPlatformRequest
    platformId?: PlatformId
}

type AssertAllProjectFlowsAreDisabledParams = {
    projectId: ProjectId
    entityManager: EntityManager
}

type HardDeleteParams = {
    id: ProjectId
    platformId: PlatformId
}