import {
    ProjectPlan, apId,
} from '@activepieces/shared'
import { ProjectPlanEntity } from './project-plan.entity'
import { databaseConnection } from '../../database/database-connection'
import dayjs from 'dayjs'
import { FlowPlanLimits, DEFAULT_FREE_PLAN_LIMIT } from '@activepieces/ee-shared'

const projectPlanRepo =
    databaseConnection.getRepository<ProjectPlan>(ProjectPlanEntity)

export const projectLimitsService = {
    async upsert(
        planLimits: Partial<FlowPlanLimits>,
        projectId: string,
    ): Promise<ProjectPlan> {
        const existingPlan = await projectPlanRepo.findOneBy({ projectId })
        if (existingPlan) {
            await projectPlanRepo.update(existingPlan.id, {
                tasks: planLimits.tasks,
                teamMembers: planLimits.teamMembers,
                flowPlanName: planLimits.nickname,
                minimumPollingInterval: planLimits.minimumPollingInterval,
                connections: planLimits.connections,
            })
        }
        else {
            await createDefaultPlan(projectId, {
                ...DEFAULT_FREE_PLAN_LIMIT,
                ...planLimits,
            })
        }
        return projectPlanRepo.findOneByOrFail({ projectId })
    },
    async getPlanByProjectId(projectId: string): Promise<ProjectPlan | null> {
        return projectPlanRepo.findOneBy({ projectId })
    },
    async increaseTask(projectId: string, tasks: number): Promise<ProjectPlan> {
        await projectPlanRepo.increment({
            projectId,
        }, 'tasks', tasks)
        return projectPlanRepo.findOneByOrFail({ projectId })
    },
    async getOrCreateDefaultPlan(projectId: string, flowPlanLimit: FlowPlanLimits): Promise<ProjectPlan> {
        const existingPlan = await projectPlanRepo.findOneBy({ projectId })
        if (!existingPlan) {
            await createDefaultPlan(projectId, flowPlanLimit)
        }
        return projectPlanRepo.findOneByOrFail({ projectId })
    },
}


async function createDefaultPlan(projectId: string, flowPlanLimit: FlowPlanLimits): Promise<ProjectPlan> {
    await projectPlanRepo.upsert({
        id: apId(),
        projectId,
        tasks: flowPlanLimit.tasks,
        teamMembers: flowPlanLimit.teamMembers,
        subscriptionStartDatetime: dayjs().toISOString(),
        minimumPollingInterval: flowPlanLimit.minimumPollingInterval,
        connections: flowPlanLimit.connections,
        flowPlanName: flowPlanLimit.nickname,
    }, ['projectId'])

    return projectPlanRepo.findOneByOrFail({ projectId })

}
