import { EntityManager, Equal, In, IsNull } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { transaction } from '../../core/db/transaction'
import { flagService } from '../../flags/flag.service'
import { flowService } from '../../flows/flow/flow.service'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { getEdition } from '../../helper/secret-helper'
import { ProjectEntity } from '../../project/project-entity'
import { projectService } from '../../project/project-service'
import { projectUsageService } from '../../project/usage/project-usage-service'
import { userService } from '../../user/user-service'
import { projectBillingService } from '../billing/project-billing/project-billing.service'
import { ProjectMemberEntity } from '../project-members/project-member.entity'
import { projectLimitsService } from '../project-plan/project-plan.service'
import { platformProjectSideEffects } from './platform-project-side-effects'
import {
    ApSubscriptionStatus,
    DEFAULT_FREE_PLAN_LIMIT,
    MAXIMUM_ALLOWED_TASKS,
    ProjectMemberStatus,
    UpdateProjectPlatformRequest,
} from '@activepieces/ee-shared'
import {
    ActivepiecesError,
    ApEdition,
    assertNotNullOrUndefined,
    Cursor,
    ErrorCode,
    FlowStatus,
    isNil,
    PlatformId,
    Project,
    ProjectId,
    ProjectWithLimits,
    SeekPage,
    spreadIfDefined,
    UserId,
} from '@activepieces/shared'

const projectRepo = repoFactory(ProjectEntity)
const projectMemberRepo = repoFactory(ProjectMemberEntity)

export const platformProjectService = {
    async getAll({
        ownerId,
        platformId,
        externalId,
        cursorRequest,
        limit,
    }: {
        ownerId: UserId | undefined
        platformId?: PlatformId
        externalId?: string
        cursorRequest: Cursor | null
        limit: number
    }): Promise<SeekPage<ProjectWithLimits>> {
        const decodedCursor = paginationHelper.decodeCursor(cursorRequest)
        const paginator = buildPaginator({
            entity: ProjectEntity,
            query: {
                limit,
                order: 'ASC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })
        const filters = await createFilters(ownerId, platformId, externalId)
        const queryBuilder = projectRepo()
            .createQueryBuilder('project')
            .leftJoinAndMapOne(
                'project.plan',
                'project_plan',
                'project_plan',
                'project.id = "project_plan"."projectId"',
            )
            .where(filters)
        const { data, cursor } = await paginator.paginate(queryBuilder)
        const projects: ProjectWithLimits[] = await Promise.all(
            data.map(enrichWithUsageAndPlan),
        )
        return paginationHelper.createPage<ProjectWithLimits>(projects, cursor)
    },

    async update({
        projectId,
        request,
    }: UpdateParams): Promise<ProjectWithLimits> {
        await projectRepo().update(
            {
                id: projectId,
                deleted: IsNull(),
            },
            {
                displayName: request.displayName,
                notifyStatus: request.notifyStatus,
            },
        )
        if (!isNil(request.plan)) {
            const isSubscribed = await isSubscribedInStripe(projectId)
            const project = await projectService.getOneOrThrow(projectId)
            const isCustomerProject = isCustomerPlatform(project.platformId)
            if (isSubscribed || isCustomerProject) {
                const newTasks = getTasksLimit(isCustomerProject, request.plan.tasks)
                await projectLimitsService.upsert(
                    {
                        ...spreadIfDefined('teamMembers', request.plan.teamMembers),
                        ...spreadIfDefined('pieces', request.plan.pieces),
                        ...spreadIfDefined('piecesFilterType', request.plan.piecesFilterType),
                        ...spreadIfDefined('tasks', newTasks),
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
        return enrichWithUsageAndPlan(
            await projectRepo().findOneByOrFail({
                id: projectId,
                deleted: IsNull(),
            }),
        )
    },

    async softDelete({ id, platformId }: SoftDeleteParams): Promise<void> {
        await transaction(async (entityManager) => {
            await assertAllProjectFlowsAreDisabled({
                projectId: id,
                entityManager,
            })

            await softDeleteOrThrow({
                id,
                platformId,
                entityManager,
            })

            await platformProjectSideEffects.onSoftDelete({
                id,
            })
        })
    },

    async hardDelete({ id }: HardDeleteParams): Promise<void> {
        await projectRepo().delete({
            id,
        })
    },
}

function getTasksLimit(isCustomerPlatform: boolean, limit: number | undefined) {
    return isCustomerPlatform ? limit : Math.min(limit ?? MAXIMUM_ALLOWED_TASKS, MAXIMUM_ALLOWED_TASKS)
}

async function isSubscribedInStripe(projectId: ProjectId): Promise<boolean> {
    const isCloud = getEdition() === ApEdition.CLOUD
    if (!isCloud) {
        return false
    }
    const status = await projectBillingService.getOrCreateForProject(projectId)
    return status.subscriptionStatus === ApSubscriptionStatus.ACTIVE
}
function isCustomerPlatform(platformId: string | undefined): boolean {
    if (isNil(platformId)) {
        return true
    }
    return !flagService.isCloudPlatform(platformId)
}
async function createFilters(
    ownerId: UserId | undefined,
    platformId?: PlatformId,
    externalId?: string | undefined,
) {
    const extraFilter = {
        deleted: IsNull(),
        ...spreadIfDefined('platformId', platformId),
        ...spreadIfDefined('externalId', externalId),
    }
    const filters = []

    if (!isNil(ownerId)) {
        const idsOfProjects = await getIdsOfProjects(ownerId)
        filters.push({ ownerId, ...extraFilter })
        filters.push({ id: In(idsOfProjects), ...extraFilter })
    }
    else {
        assertNotNullOrUndefined(platformId, 'platformId')
        filters.push({ ...extraFilter })
    }

    return filters
}

async function getIdsOfProjects(ownerId: UserId): Promise<string[]> {
    const user = await userService.getMetaInfo({ id: ownerId })
    const members = await projectMemberRepo().findBy({
        email: user?.email,
        platformId: isNil(user?.platformId) ? IsNull() : Equal(user?.platformId),
        status: Equal(ProjectMemberStatus.ACTIVE),
    })
    return members.map((member) => member.projectId)
}

async function enrichWithUsageAndPlan(
    project: Project,
): Promise<ProjectWithLimits> {
    return {
        ...project,
        plan: await projectLimitsService.getOrCreateDefaultPlan(
            project.id,
            DEFAULT_FREE_PLAN_LIMIT,
        ),
        usage: await projectUsageService.getUsageForBillingPeriod(
            project.id,
            projectUsageService.getCurrentingStartPeriod(project.created),
        ),
    }
}

const assertAllProjectFlowsAreDisabled = async (
    params: AssertAllProjectFlowsAreDisabledParams,
): Promise<void> => {
    const { projectId, entityManager } = params

    const projectHasEnabledFlows = await flowService.existsByProjectAndStatus({
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

const softDeleteOrThrow = async ({
    id,
    platformId,
    entityManager,
}: SoftDeleteOrThrowParams): Promise<void> => {
    const deleteResult = await projectRepo(entityManager).softDelete({
        id,
        platformId,
        deleted: IsNull(),
    })

    if (deleteResult.affected !== 1) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                entityId: id,
                entityType: 'project',
            },
        })
    }
}

type UpdateParams = {
    projectId: ProjectId
    request: UpdateProjectPlatformRequest
    platformId?: PlatformId
}

type SoftDeleteParams = {
    id: ProjectId
    platformId: PlatformId
}

type SoftDeleteOrThrowParams = SoftDeleteParams & {
    entityManager: EntityManager
}

type AssertAllProjectFlowsAreDisabledParams = {
    projectId: ProjectId
    entityManager: EntityManager
}

type HardDeleteParams = {
    id: ProjectId
}
