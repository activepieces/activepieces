import { DEFAULT_FREE_PLAN_LIMIT, FlowPlanLimits } from '@activepieces/ee-shared'
import {
    ActivepiecesError,
    apId, ErrorCode, isNil, ProjectPlan,
} from '@activepieces/shared'
import { repoFactory } from '../../core/db/repo-factory'
import { ProjectPlanEntity } from './project-plan.entity'

const projectPlanRepo = repoFactory<ProjectPlan>(ProjectPlanEntity)

export const projectLimitsService = {
    async upsert(
        planLimits: Partial<FlowPlanLimits>,
        projectId: string,
    ): Promise<ProjectPlan> {
        const existingPlan = await projectPlanRepo().findOneBy({ projectId })
        if (existingPlan) {
            await projectPlanRepo().update(existingPlan.id, {
                tasks: planLimits.tasks,
                name: planLimits.nickname,
                pieces: planLimits.pieces,
                piecesFilterType: planLimits.piecesFilterType,
                aiTokens: planLimits.aiTokens,
            })
        }
        else {
            await createDefaultPlan(projectId, {
                ...DEFAULT_FREE_PLAN_LIMIT,
                ...planLimits,
            })
        }
        return projectPlanRepo().findOneByOrFail({ projectId })
    },
    async getPlanByProjectId(projectId: string): Promise<ProjectPlan | null> {
        return projectPlanRepo().findOneBy({ projectId })
    },
    async getOrCreateDefaultPlan(projectId: string, flowPlanLimit: FlowPlanLimits): Promise<ProjectPlan> {
        const existingPlan = await projectPlanRepo().findOneBy({ projectId })
        if (!existingPlan) {
            await createDefaultPlan(projectId, flowPlanLimit)
        }
        return projectPlanRepo().findOneByOrFail({ projectId })
    },
    async getPiecesFilter(projectId: string): Promise<Pick<ProjectPlan, 'piecesFilterType' | 'pieces'>> {
        const plan = await projectPlanRepo().createQueryBuilder().select(['"piecesFilterType"', 'pieces']).where('"projectId" = :projectId', { projectId }).getRawOne()
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
    await projectPlanRepo().upsert({
        id: apId(),
        projectId,
        pieces: flowPlanLimit.pieces,
        piecesFilterType: flowPlanLimit.piecesFilterType,
        tasks: flowPlanLimit.tasks,
        aiTokens: flowPlanLimit.aiTokens,
        name: flowPlanLimit.nickname,
    }, ['projectId'])

    return projectPlanRepo().findOneByOrFail({ projectId })

}
