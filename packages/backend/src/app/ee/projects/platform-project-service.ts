import { ActivepiecesError, ErrorCode, Project, ProjectId, ProjectType, UserId, isNil } from '@activepieces/shared'
import { Equal, In } from 'typeorm'
import { PlatformId, ProjectMemberStatus, ProjectWithUsageAndPlan, UpdateProjectPlatformRequest } from '@activepieces/ee-shared'
import { ProjectMemberEntity } from '../project-members/project-member.entity'
import { ProjectEntity } from '../../project/project-entity'
import { databaseConnection } from '../../database/database-connection'
import { plansService } from '../billing/project-plan/project-plan.service'
import { projectUsageService } from '../billing/project-usage/project-usage-service'
import { platformService } from '../platform/platform.service'

const projectRepo = databaseConnection.getRepository(ProjectEntity)
const projectMemberRepo = databaseConnection.getRepository(ProjectMemberEntity)

export const platformProjectService = {
    async getAll({ ownerId, platformId }: { ownerId: UserId, platformId?: PlatformId }): Promise<ProjectWithUsageAndPlan[]> {
        const idsOfProjects = (await projectMemberRepo.findBy({
            userId: ownerId,
            status: Equal(ProjectMemberStatus.ACTIVE),
        })).map(member => member.projectId)
        const extraFilter = isNil(platformId) ? {} : { platformId: Equal(platformId) }
        const projectPlans = await projectRepo.createQueryBuilder('project')
            .leftJoinAndMapOne('project.plan', 'project_plan', 'project_plan', 'project.id = "project_plan"."projectId"')
            .where(
                [
                    {
                        ownerId,
                        ...extraFilter,
                    },
                    {
                        id: In(idsOfProjects),
                        ...extraFilter,
                    },
                ],
            )
            .getMany()
        return await Promise.all(projectPlans.map(enrichWithUsageAndPlan))
    },

    async update({ userId, projectId, request, platformId }: { userId: string, projectId: ProjectId, request: UpdateProjectPlatformRequest, platformId?: PlatformId }): Promise<ProjectWithUsageAndPlan | null> {
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
        const isPlatformOwner = !isNil(platformId) && await platformService.checkUserIsOwner({ userId, platformId })
        const canEditProject = isProjectOwner || isPlatformOwner
        if (!canEditProject) {
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
        return enrichWithUsageAndPlan(await projectRepo.findOneByOrFail({
            id: projectId,
        }))
    },
}

async function enrichWithUsageAndPlan(project: Project): Promise<ProjectWithUsageAndPlan> {
    const clonedProject: ProjectWithUsageAndPlan = JSON.parse(JSON.stringify(project))

    if (isNil(clonedProject.plan)) {
        clonedProject.plan = await plansService.getOrCreateDefaultPlan({
            projectId: project.id,
        })
    }

    clonedProject.usage = await projectUsageService.getUsageByProjectId(project.id)

    return clonedProject
}