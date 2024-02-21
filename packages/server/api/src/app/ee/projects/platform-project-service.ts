import {
    ActivepiecesError,
    ErrorCode,
    Project,
    ProjectId,
    ProjectType,
    UserId,
    isNil,
    SeekPage,
    assertNotNullOrUndefined,
    spreadIfDefined,
} from '@activepieces/shared'
import { Equal, In, IsNull } from 'typeorm'
import {
    PlatformId,
    ProjectMemberStatus,
    ProjectWithUsageAndPlanResponse,
    UpdateProjectPlatformRequest,
} from '@activepieces/ee-shared'
import { ProjectMemberEntity } from '../project-members/project-member.entity'
import { ProjectEntity } from '../../project/project-entity'
import { databaseConnection } from '../../database/database-connection'
import { plansService } from '../billing/project-plan/project-plan.service'
import { projectUsageService } from '../billing/project-usage/project-usage-service'
import { userService } from '../../user/user-service'
import { paginationHelper } from '../../helper/pagination/pagination-utils'

const projectRepo = databaseConnection.getRepository(ProjectEntity)
const projectMemberRepo = databaseConnection.getRepository(ProjectMemberEntity)

export const platformProjectService = {
    async getAll({
        ownerId,
        platformId,
        externalId,
    }: {
        ownerId: UserId | undefined
        platformId?: PlatformId
        externalId?: string
    }): Promise<SeekPage<ProjectWithUsageAndPlanResponse>> {
        const filters = await createFilters(ownerId, platformId, externalId)
        const projectPlans = await projectRepo
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
        const projects: ProjectWithUsageAndPlanResponse[] = await Promise.all(
            projectPlans.map(enrichWithUsageAndPlan),
        )
        return paginationHelper.createPage<ProjectWithUsageAndPlanResponse>(
            projects,
            null,
        )
    },

    async update({
        userId,
        projectId,
        request,
    }: {
        userId: string
        projectId: ProjectId
        request: UpdateProjectPlatformRequest
        platformId?: PlatformId
    }): Promise<ProjectWithUsageAndPlanResponse> {
        const project = await projectRepo.findOneBy({
            id: projectId,
        })
        if (isNil(project)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'project',
                    entityId: projectId,
                },
            })
        }
        const isProjectOwner = project.ownerId === userId
        if (!isProjectOwner) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {},
            })
        }
        await projectRepo.update(projectId, {
            displayName: request.displayName,
            notifyStatus: request.notifyStatus,
        })
        if (project.type === ProjectType.PLATFORM_MANAGED && !isNil(request.plan)) {
            await plansService.update({
                projectId,
                planLimits: {
                    teamMembers: request.plan.teamMembers,
                    tasks: request.plan.tasks,
                },
                subscription: null,
            })
        }
        return this.getWithPlanAndUsageOrThrow(projectId)
    },
    async getWithPlanAndUsageOrThrow(
        projectId: string,
    ): Promise<ProjectWithUsageAndPlanResponse> {
        return enrichWithUsageAndPlan(
            await projectRepo.findOneByOrFail({
                id: projectId,
            }),
        )
    },
}

async function createFilters(
    ownerId: UserId | undefined,
    platformId?: PlatformId,
    externalId?: string | undefined,
) {
    const extraFilter = {
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
    const members = await projectMemberRepo.findBy({
        email: user?.email,
        platformId: isNil(user?.platformId) ? IsNull() : Equal(user?.platformId),
        status: Equal(ProjectMemberStatus.ACTIVE),
    })
    return members.map((member) => member.projectId)
}

async function enrichWithUsageAndPlan(
    project: Project,
): Promise<ProjectWithUsageAndPlanResponse> {
    const clonedProject: ProjectWithUsageAndPlanResponse = JSON.parse(
        JSON.stringify(project),
    )

    if (isNil(clonedProject.plan)) {
        clonedProject.plan = await plansService.getOrCreateDefaultPlan({
            projectId: project.id,
        })
    }

    clonedProject.usage = await projectUsageService.getUsageByProjectId(
        project.id,
    )

    return clonedProject
}
