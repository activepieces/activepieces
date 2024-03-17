import {
    Project,
    ProjectId,
    UserId,
    isNil,
    SeekPage,
    assertNotNullOrUndefined,
    spreadIfDefined,
    ProjectWithLimits,
    ApEdition,
    PlatformId,
    ActivepiecesError,
    ErrorCode,
    FlowStatus,
} from '@activepieces/shared'
import { EntityManager, Equal, In, IsNull } from 'typeorm'
import {
    ApSubscriptionStatus,
    DEFAULT_FREE_PLAN_LIMIT,
    MAXIMUM_ALLOWED_TASKS,
    ProjectMemberStatus,
    UpdateProjectPlatformRequest,
} from '@activepieces/ee-shared'
import { ProjectMemberEntity } from '../project-members/project-member.entity'
import { ProjectEntity } from '../../project/project-entity'
import { userService } from '../../user/user-service'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { projectLimitsService } from '../project-plan/project-plan.service'
import { projectUsageService } from '../../project/usage/project-usage-service'
import { getEdition } from '../../helper/secret-helper'
import { projectBillingService } from '../billing/project-billing/project-billing.service'
import { flagService } from '../../flags/flag.service'
import { projectService } from '../../project/project-service'
import { transaction } from '../../core/db/transaction'
import { flowService } from '../../flows/flow/flow.service'
import { repoFactory } from '../../core/db/repo-factory'
import { platformProjectSideEffects } from './platform-project-side-effects'

const projectRepo = repoFactory(ProjectEntity)
const projectMemberRepo = repoFactory(ProjectMemberEntity)

export const platformProjectService = {
    async getAll({
        ownerId,
        platformId,
        externalId,
    }: {
        ownerId: UserId | undefined
        platformId?: PlatformId
        externalId?: string
    }): Promise<SeekPage<ProjectWithLimits>> {
        const filters = await createFilters(ownerId, platformId, externalId)
        const projectPlans = await projectRepo()
            .createQueryBuilder('project')
            .leftJoinAndMapOne(
                'project.plan',
                'project_plan',
                'project_plan',
                'project.id = "project_plan"."projectId"',
            )
            .where(filters)
            // TODO add pagination
            .limit(50)
            .getMany()
        const projects: ProjectWithLimits[] = await Promise.all(
            projectPlans.map(enrichWithUsageAndPlan),
        )
        return paginationHelper.createPage<ProjectWithLimits>(
            projects,
            null,
        )
    },

    async update({ projectId, request }: UpdateParams): Promise<ProjectWithLimits> {
        await projectRepo().update({
            id: projectId,
            deleted: IsNull(),
        }, {
            displayName: request.displayName,
            notifyStatus: request.notifyStatus,
        })
        if (!isNil(request.plan)) {
            const isCloud = getEdition() === ApEdition.CLOUD
            const isSubscribed = isCloud ? (await projectBillingService.getOrCreateForProject(projectId)).subscriptionStatus === ApSubscriptionStatus.ACTIVE : false
            const project = await projectService.getOneOrThrow(projectId)
            const isCloudProject = project.platformId && flagService.isCloudPlatform(project.platformId)

            if (isSubscribed || !isCloudProject) {
                const newTasks = isCloudProject ? request.plan.tasks : Math.min(request.plan.tasks, MAXIMUM_ALLOWED_TASKS)
                await projectLimitsService.upsert({
                    ...spreadIfDefined('teamMembers', request.plan.teamMembers),
                    tasks: newTasks,
                }, projectId)
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
        plan: await projectLimitsService.getOrCreateDefaultPlan(project.id, DEFAULT_FREE_PLAN_LIMIT),
        usage: await projectUsageService.getUsageForBillingPeriod(project.id, projectUsageService.getCurrentingStartPeriod(project.created)),
    }
}

const assertAllProjectFlowsAreDisabled = async (params: AssertAllProjectFlowsAreDisabledParams): Promise<void> => {
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
                message: 'project has enabled flows',
            },
        })
    }
}

const softDeleteOrThrow = async ({ id, platformId, entityManager }: SoftDeleteOrThrowParams): Promise<void> => {
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
