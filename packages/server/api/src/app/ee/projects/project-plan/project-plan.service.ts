import { DEFAULT_FREE_PLAN_LIMIT, FlowPlanLimits } from '@activepieces/ee-shared'
import { exceptionHandler } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ApEdition,
    apId, ErrorCode, isNil, ProjectPlan,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../../core/db/repo-factory'
import { system } from '../../../helper/system/system'
import { platformService } from '../../../platform/platform.service'
import { projectService } from '../../../project/project-service'
import { platformBillingService } from '../../platform/platform-billing/platform-billing.service'
import { BillingUsageType, usageService } from '../../platform/platform-usage-service'
import { ProjectPlanEntity } from './project-plan.entity'

const projectPlanRepo = repoFactory<ProjectPlan>(ProjectPlanEntity)
const edition = system.getEdition()

export const projectLimitsService = (log: FastifyBaseLogger) => ({
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
    async tasksExceededLimit(projectId: string): Promise<boolean> {
        return checkUsageLimit({
            projectId,
            incrementBy: 0,
            usageType: BillingUsageType.TASKS,
            log,
        })
    },

    async aiTokensExceededLimit(projectId: string, tokensToConsume: number): Promise<boolean> {
        return checkUsageLimit({
            projectId,
            incrementBy: tokensToConsume,
            usageType: BillingUsageType.AI_TOKENS,
            log,
        })
    },
})



async function checkUsageLimit({ projectId, incrementBy, usageType, log }: { projectId: string, incrementBy: number, usageType: BillingUsageType, log: FastifyBaseLogger }): Promise<boolean> {
    if (![ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
        return false
    }
    try {
        const projectPlan = await projectLimitsService(log).getPlanByProjectId(projectId)
        if (!projectPlan) {
            return false
        }
        const platformId = await projectService.getPlatformId(projectId)
        const { consumedProjectUsage, consumedPlatformUsage } = await usageService(log).increaseProjectAndPlatformUsage({ projectId, incrementBy, usageType })
        const planLimit = usageType === BillingUsageType.TASKS ? projectPlan.tasks : projectPlan.aiTokens
        const shouldLimitFromProjectPlan = !isNil(planLimit) && consumedProjectUsage >= planLimit
        if (edition === ApEdition.ENTERPRISE) {
            return shouldLimitFromProjectPlan
        }
        const platform = await platformService.getOneOrThrow(platformId)
        const platformBilling = await platformBillingService(log).getOrCreateForPlatform(platformId)
        const platformLimit = usageType === BillingUsageType.TASKS ? platformBilling.tasksLimit : platformBilling.aiCreditsLimit
        const shouldLimitFromPlatformBilling = !isNil(platformLimit) && consumedPlatformUsage >= platformLimit
        if (!platform.manageProjectsEnabled) {
            return shouldLimitFromPlatformBilling
        }
        return shouldLimitFromProjectPlan || shouldLimitFromPlatformBilling
    }
    catch (e) {
        exceptionHandler.handle(e, log)
        return false
    }
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
