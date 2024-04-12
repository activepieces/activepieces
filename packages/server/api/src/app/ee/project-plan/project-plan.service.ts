import { isNil } from 'lodash'
import { databaseConnection } from '../../database/database-connection'
import { ProjectPlanEntity } from './project-plan.entity'
import { DEFAULT_FREE_PLAN_LIMIT, FlowPlanLimits } from '@activepieces/ee-shared'
import {
    ActivepiecesError,
    apId, ErrorCode, ProjectPlan,
} from '@activepieces/shared'

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
                name: planLimits.nickname,
                pieces: planLimits.pieces,
                piecesFilterType: planLimits.piecesFilterType,
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
    async getPiecesFilter(projectId: string): Promise<Pick<ProjectPlan, 'piecesFilterType' | 'pieces'>> {
        const plan = await projectPlanRepo.createQueryBuilder().select(['"piecesFilterType"', 'pieces']).where('"projectId" = :projectId', { projectId }).getRawOne()
        if (isNil(plan)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: `Project plan not found for project id: ${projectId}`,
                },
            })
        }
        return {
            piecesFilterType: plan.piecesFilterType,
            pieces: plan.pieces,
        }
    },
}


async function createDefaultPlan(projectId: string, flowPlanLimit: FlowPlanLimits): Promise<ProjectPlan> {
    await projectPlanRepo.upsert({
        id: apId(),
        projectId,
        pieces: flowPlanLimit.pieces,
        piecesFilterType: flowPlanLimit.piecesFilterType,
        tasks: flowPlanLimit.tasks,
        teamMembers: flowPlanLimit.teamMembers,
        minimumPollingInterval: flowPlanLimit.minimumPollingInterval,
        connections: flowPlanLimit.connections,
        name: flowPlanLimit.nickname,
    }, ['projectId'])

    return projectPlanRepo.findOneByOrFail({ projectId })

}
