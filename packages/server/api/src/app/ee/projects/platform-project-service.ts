import {
    ApSubscriptionStatus,
    DEFAULT_FREE_PLAN_LIMIT,
    MAXIMUM_ALLOWED_TASKS,
    UpdateProjectPlatformRequest,
} from '@activepieces/ee-shared'
import { system } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ApEdition,
    assertNotNullOrUndefined,
    Cursor,
    ErrorCode,
    FlowStatus,
    isNil,
    PlatformId,
    PlatformRole,
    PrincipalType,
    Project,
    ProjectId,
    ProjectWithLimits,
    SeekPage,
    spreadIfDefined,
    UserStatus,
} from '@activepieces/shared'
import { EntityManager, Equal, ILike, In, IsNull } from 'typeorm'
import { appConnectionService } from '../../app-connection/app-connection-service/app-connection-service'
import { repoFactory } from '../../core/db/repo-factory'
import { transaction } from '../../core/db/transaction'
import { flagService } from '../../flags/flag.service'
import { flowService } from '../../flows/flow/flow.service'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { ProjectEntity } from '../../project/project-entity'
import { projectService } from '../../project/project-service'
import { projectUsageService } from '../../project/usage/project-usage-service'
import {  userService } from '../../user/user-service'
import { projectBillingService } from '../billing/project-billing/project-billing.service'
import { ProjectMemberEntity } from '../project-members/project-member.entity'
import { projectLimitsService } from '../project-plan/project-plan.service'
import { platformProjectSideEffects } from './platform-project-side-effects'

const projectRepo = repoFactory(ProjectEntity)
const projectMemberRepo = repoFactory(ProjectMemberEntity)
export const platformProjectService = {
    async getAll(params: GetAllParams): Promise<SeekPage<ProjectWithLimits>> {
        const { cursorRequest, limit } = params
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
        const filters = await createFilters(params)
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
            data.map(enrichProject),
        )
        return paginationHelper.createPage<ProjectWithLimits>(projects, cursor)
    },

    async update({
        projectId,
        request,
    }: UpdateParams): Promise<ProjectWithLimits> {
        await projectService.update(projectId, request)
        if (!isNil(request.plan)) {
            const isSubscribed = await isSubscribedInStripe(projectId)
            const project = await projectService.getOneOrThrow(projectId)
            const isCustomerProject = isCustomerPlatform(project.platformId)
            if (isSubscribed || isCustomerProject) {
                const newTasks = getTasksLimit(isCustomerProject, request.plan.tasks)
                await projectLimitsService.upsert(
                    {
                        ...spreadIfDefined('pieces', request.plan.pieces),
                        ...spreadIfDefined('piecesFilterType', request.plan.piecesFilterType),
                        ...spreadIfDefined('tasks', newTasks),
                        ...spreadIfDefined('aiTokens', request.plan.aiTokens),
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
        await appConnectionService.deleteAllProjectConnections(id)
    },
}

type GetAllParams = {
    principalType: PrincipalType
    principalId: string
    platformId: string
    externalId?: string
    displayName?: string
    cursorRequest: Cursor | null
    limit: number
}

function getTasksLimit(isCustomerPlatform: boolean, limit: number | undefined) {
    return isCustomerPlatform ? limit : Math.min(limit ?? MAXIMUM_ALLOWED_TASKS, MAXIMUM_ALLOWED_TASKS)
}

async function isSubscribedInStripe(projectId: ProjectId): Promise<boolean> {
    const isCloud = system.getEdition() === ApEdition.CLOUD
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
async function createFilters({ platformId, principalType, principalId, externalId, displayName }: GetAllParams) {
    const displayNameFilter = displayName ? {
        displayName: ILike(`%${displayName}%`),
    } : {}
    const commonFilter = {
        deleted: IsNull(),
        ...spreadIfDefined('platformId', platformId),
        ...spreadIfDefined('externalId', externalId),
        ...displayNameFilter,
    }
    switch (principalType) {
        case PrincipalType.SERVICE: {
            return commonFilter
        }
        case PrincipalType.USER: {
            const user = await userService.getMetaInfo({ id: principalId })
            assertNotNullOrUndefined(user, 'User not found')
            if (user.platformRole === PlatformRole.ADMIN) {
                return commonFilter
            }
            else {
                const ids = await getIdsOfProjects({
                    platformId,
                    userId: user.id,
                })
                return [
                    {
                        ...commonFilter,
                        id: In(ids),
                    },
                    {
                        ...commonFilter,
                        ownerId: Equal(user.id),
                    },
                ]
            }
        }
        default: {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'INVALID_PRINCIPAL_TYPE',
                },
            })
        }
    }
}

async function getIdsOfProjects({ platformId, userId }: { platformId: string, userId: string }): Promise<string[]> {
    const members = await projectMemberRepo().findBy({
        userId,
        platformId: Equal(platformId),
    })
    return members.map((member) => member.projectId)
}

async function enrichProject(
    project: Project,
): Promise<ProjectWithLimits> {
    const totalUsers = await projectMemberRepo().countBy({
        projectId: project.id,
    })
    const activeUsers = await projectMemberRepo()
        .createQueryBuilder('project_member')
        .leftJoin('user', 'user', 'user.id = project_member."userId"')
        .groupBy('user.id')
        .where(`user.status = '${UserStatus.ACTIVE}' and project_member."projectId" = '${project.id}'`)
        .getCount()
  
    const totalFlows = await flowService.count({
        projectId: project.id,
    })

    const activeFlows = await flowService.count({
        projectId: project.id,
        status: FlowStatus.ENABLED,
    })

  
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
