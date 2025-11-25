import { ProjectPlanLimits } from '@activepieces/ee-shared'
import { exceptionHandler } from '@activepieces/server-shared'
import {
    AiOverageState,
    ApEdition,
    apId,
    isNil,
    PiecesFilterType,
    PlatformPlan,
    ProjectPlan,
    spreadIfDefined,
    spreadIfNotUndefined,
    TeamProjectsLimit,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../../core/db/repo-factory'
import { system } from '../../../helper/system/system'
import { projectService } from '../../../project/project-service'
import { platformPlanService } from '../../platform/platform-plan/platform-plan.service'
import { platformUsageService } from '../../platform/platform-usage-service'
import { ProjectPlanEntity } from './project-plan.entity'

const projectPlanRepo = repoFactory<ProjectPlan>(ProjectPlanEntity)
const edition = system.getEdition()

export const projectLimitsService = (log: FastifyBaseLogger) => ({
    async upsert(
        planLimits: ProjectPlanLimits,
        projectId: string,
    ): Promise<ProjectPlan> {
        const projectPlan = await this.getOrCreateDefaultPlan(projectId)
        await projectPlanRepo().update(projectPlan.id, {
            ...spreadIfNotUndefined('aiCredits', planLimits.aiCredits),
            ...spreadIfDefined('name', planLimits.nickname),
            ...spreadIfDefined('locked', planLimits.locked),
            ...spreadIfDefined('pieces', planLimits.pieces),
            ...spreadIfDefined('piecesFilterType', planLimits.piecesFilterType),
        })
        return projectPlanRepo().findOneByOrFail({ projectId })
    },
    async getPlanWithPlatformLimits(projectId: string): Promise<ProjectPlan> {
        const projectPlan = await this.getOrCreateDefaultPlan(projectId)
        const platformId = await projectService.getPlatformId(projectId)
        const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
        return {
            ...projectPlan,
            ...getProjectLimits(projectPlan, platformPlan),
        }
    },

    async getOrCreateDefaultPlan(projectId: string): Promise<ProjectPlan> {
        const existingPlan = await projectPlanRepo().findOneBy({ projectId })

        if (!isNil(existingPlan)) {
            return existingPlan
        }

        await projectPlanRepo().upsert({
            id: apId(),
            projectId,
            pieces: [],
            piecesFilterType: PiecesFilterType.NONE,
            locked: false,
            aiCredits: null,
            name: 'free',
        }, ['projectId'])

        return projectPlanRepo().findOneByOrFail({ projectId })
    },

    async checkAICreditsExceededLimit({ projectId, requestCostBeforeFiring }: { projectId: string, requestCostBeforeFiring: number }): Promise<boolean> {
        if (edition === ApEdition.COMMUNITY) {
            return false
        }

        const projectPlan = await projectLimitsService(system.globalLogger()).getOrCreateDefaultPlan(projectId)

        try {
            const platformId = await projectService.getPlatformId(projectId)
            const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
            const { startDate, endDate } = await platformPlanService(log).getBillingDates(platformPlan)

            const projectAICreditUsage = await platformUsageService(log).getProjectUsage({ projectId, metric: 'ai_credits', startDate, endDate }) + requestCostBeforeFiring
            const platformAICreditUsage = await platformUsageService(log).getPlatformUsage({ platformId, metric: 'ai_credits', startDate, endDate }) + requestCostBeforeFiring

            const aiCreditPlatformLimit = await platformReachedLimit({ platformPlan, platformUsage: platformAICreditUsage, log })
            const aiCreditPorjectLimit = await projectReachedLimit({ projectPlan, teamProjectsLimit: platformPlan.teamProjectsLimit, projectUsage: projectAICreditUsage, log })

            return aiCreditPlatformLimit || aiCreditPorjectLimit
        }
        catch (e) {
            exceptionHandler.handle(e, log)
            return false
        }
    },
})

async function projectReachedLimit(params: LimitReachedFromProjectPlanParams): Promise<boolean> {
    const { teamProjectsLimit, projectPlan, projectUsage } = params
    if (teamProjectsLimit === TeamProjectsLimit.NONE) {
        return false
    }
    const projectLimit = projectPlan.aiCredits

    if (isNil(projectLimit)) {
        return false
    }
    return projectUsage >= projectLimit
}

async function platformReachedLimit(params: LimitReachedFromPlatformBillingParams): Promise<boolean> {
    if (edition === ApEdition.ENTERPRISE) {
        return false
    }

    const { platformPlan, platformUsage } = params
    const isOverageEnabled = platformPlan.aiCreditsOverageState === AiOverageState.ALLOWED_AND_ON

    const platformLimit = platformPlan.includedAiCredits

    if (isNil(platformLimit)) {
        return false
    }

    const totalLimit = isOverageEnabled
        ? platformLimit + (platformPlan.aiCreditsOverageLimit ?? 0)
        : platformLimit

    return platformUsage >= totalLimit
}

function getProjectLimits(projectPlan: ProjectPlan, platformPlan: PlatformPlan): { aiCredits: number | undefined } {
    if (edition !== ApEdition.CLOUD) {
        return {
            aiCredits: projectPlan.aiCredits ?? undefined,
        }
    }

    const isOverageEnabled = platformPlan.aiCreditsOverageState === AiOverageState.ALLOWED_AND_ON

    const aiCreditsLimit = (isOverageEnabled ? (platformPlan.aiCreditsOverageLimit ?? 0) : 0) + platformPlan.includedAiCredits

    if (platformPlan.teamProjectsLimit === TeamProjectsLimit.NONE) {
        return {
            aiCredits: aiCreditsLimit,
        }
    }

    return {
        aiCredits: projectPlan.aiCredits ?? aiCreditsLimit,
    }

}

type LimitReachedFromProjectPlanParams = {
    projectPlan: ProjectPlan
    teamProjectsLimit: TeamProjectsLimit
    log: FastifyBaseLogger
    projectUsage: number
}

type LimitReachedFromPlatformBillingParams = {
    platformPlan: PlatformPlan
    log: FastifyBaseLogger
    platformUsage: number
}