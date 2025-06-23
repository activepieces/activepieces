import { FlowPlanLimits } from '@activepieces/ee-shared'
import { exceptionHandler } from '@activepieces/server-shared'
import {
    ApEdition,
    apId,
    isNil,
    PiecesFilterType,
    PlatformPlan,
    ProjectPlan,
    spreadIfDefined,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../../core/db/repo-factory'
import { system } from '../../../helper/system/system'
import { platformService } from '../../../platform/platform.service'
import { projectService } from '../../../project/project-service'
import { platformPlanService } from '../../platform/platform-plan/platform-plan.service'
import { stripeHelper } from '../../platform/platform-plan/stripe-helper'
import { platformUsageService } from '../../platform/platform-usage-service'
import { ProjectPlanEntity } from './project-plan.entity'

const projectPlanRepo = repoFactory<ProjectPlan>(ProjectPlanEntity)
const edition = system.getEdition()

export const projectLimitsService = (log: FastifyBaseLogger) => ({
    async upsert(
        planLimits: Partial<FlowPlanLimits>,
        projectId: string,
    ): Promise<ProjectPlan> {
        const projectPlan = await getOrCreateDefaultPlan(projectId)
        await projectPlanRepo().update(projectPlan.id, {
            ...spreadIfDefined('tasks', planLimits.tasks),
            ...spreadIfDefined('name', planLimits.nickname),
            ...spreadIfDefined('pieces', planLimits.pieces),
            ...spreadIfDefined('piecesFilterType', planLimits.piecesFilterType),
            ...spreadIfDefined('aiCredits', planLimits.aiCredits),
        })
        return projectPlanRepo().findOneByOrFail({ projectId })
    },
    async getPlanWithPlatformLimits(projectId: string): Promise<ProjectPlan> {
        const projectPlan = await getOrCreateDefaultPlan(projectId)
        const platformId = await projectService.getPlatformId(projectId)
        const platformBilling = await getPlatformBillingOnCloudAndManageIsOff(platformId, log)
        return {
            ...projectPlan,
            tasks: projectPlan.tasks ?? platformBilling?.tasksLimit,
            aiCredits: projectPlan.aiCredits,
        }
    },

    async checkTasksExceededLimit(projectId: string): Promise<boolean> {
        if (edition === ApEdition.COMMUNITY) {
            return false
        }
        try {
            // TODO (@abuaboud): optmize this by not querying the database
            const projectPlan = await getOrCreateDefaultPlan(projectId)
            if (!projectPlan) {
                return false
            }
            const platformId = await projectService.getPlatformId(projectId)
            const { manageProjectsEnabled } = await platformPlanService(log).getOrCreateForPlatform(platformId)

            const platformBilling = await platformPlanService(log).getOrCreateForPlatform(platformId)
            const { stripeSubscriptionStartDate: startDate, stripeSubscriptionEndDate: endDate } = platformBilling

            const projectTasksUsage = await platformUsageService(log).getProjectUsage({ projectId, metric: 'tasks', startDate, endDate })
            const platformTasksUsage = await platformUsageService(log).getPlatformUsage({ platformId, metric: 'tasks', startDate, endDate })

            const tasksPlatformLimit = await platformReachedLimit({ platformId, platformUsage: platformTasksUsage, log, usageType: 'tasks' })
            const tasksPorjectLimit = await projectReachedLimit({ projectId, manageProjectsEnabled, projectUsage: projectTasksUsage, log, usageType: 'tasks' })
            return tasksPorjectLimit || tasksPlatformLimit
        }
        catch (e) {
            exceptionHandler.handle(e, log)
            return false
        }
    },


    async checkAICreditsExceededLimit(projectId: string): Promise<boolean> {
        if (edition === ApEdition.COMMUNITY) {
            return false
        }

        const platformId = await projectService.getPlatformId(projectId)

        const { manageProjectsEnabled } = await platformPlanService(log).getOrCreateForPlatform(platformId)

        const platformBilling = await platformPlanService(log).getOrCreateForPlatform(platformId)
        const { stripeSubscriptionStartDate: startDate, stripeSubscriptionEndDate: endDate } = platformBilling

        const projectAICreditUsage = await platformUsageService(log).getProjectUsage({ projectId, metric: 'ai_credits', startDate, endDate })
        const platformAICreditUsage = await platformUsageService(log).getPlatformUsage({ platformId, metric: 'ai_credits', startDate, endDate })

        const aiCreditPlatformLimit = await platformReachedLimit({ platformId, platformUsage: platformAICreditUsage, log, usageType: 'aiCredit' })
        const aiCreditPorjectLimit = await projectReachedLimit({ projectId, manageProjectsEnabled, projectUsage: projectAICreditUsage, log, usageType: 'aiCredit' })

        return aiCreditPlatformLimit || aiCreditPorjectLimit
    },
})

async function getOrCreateDefaultPlan(projectId: string): Promise<ProjectPlan> {
    const existingPlan = await projectPlanRepo().findOneBy({ projectId })

    if (existingPlan) return existingPlan

    await projectPlanRepo().upsert({
        id: apId(),
        projectId,
        pieces: [],
        piecesFilterType: PiecesFilterType.NONE,
        tasks: null,
        aiCredits: null,
        name: 'free',
    }, ['projectId'])

    return projectPlanRepo().findOneByOrFail({ projectId })
}


async function getPlatformBillingOnCloudAndManageIsOff(platformId: string, log: FastifyBaseLogger): Promise<PlatformPlan | undefined> {
    if (edition !== ApEdition.CLOUD) {
        return undefined
    }
    const platform = await platformService.getOneWithPlanOrThrow(platformId)
    if (platform.plan.manageProjectsEnabled) {
        return undefined
    }
    return platformPlanService(log).getOrCreateForPlatform(platformId)
}




async function projectReachedLimit(params: LimitReachedFromProjectPlanParams): Promise<boolean> {
    const { manageProjectsEnabled, projectId, projectUsage, usageType } = params
    if (!manageProjectsEnabled) {
        return false
    }
    const projectPlan = await getOrCreateDefaultPlan(projectId)
    const projectLimit = usageType === 'tasks' ? projectPlan.tasks ?? undefined : projectPlan.aiCredits

    if (isNil(projectLimit)) {
        return false
    }
    return projectUsage >= projectLimit
}

async function platformReachedLimit(params: LimitReachedFromPlatformBillingParams): Promise<boolean> {
    if (edition === ApEdition.ENTERPRISE) {
        return false
    }

    const { platformId, platformUsage, usageType, log } = params
    const platformBilling = await platformPlanService(log).getOrCreateForPlatform(platformId)

    const isOverageEnabled = !isNil(platformBilling.aiCreditsLimit)
    
    const platformLimit = usageType === 'tasks'
        ? platformBilling.tasksLimit
        : platformBilling.aiCreditsLimit ?? platformBilling.includedAiCredits

    if (isNil(platformLimit)) {
        return false
    }

    const totalLimit = usageType === 'aiCredit' && isOverageEnabled
        ? platformLimit + platformBilling.includedAiCredits
        : platformLimit

    return platformUsage >= totalLimit
}


type LimitReachedFromProjectPlanParams = {
    projectId: string
    manageProjectsEnabled: boolean
    usageType: 'tasks' | 'aiCredit'
    log: FastifyBaseLogger
    projectUsage: number
}

type LimitReachedFromPlatformBillingParams = {
    platformId: string
    usageType: 'tasks' | 'aiCredit' 
    log: FastifyBaseLogger
    platformUsage: number
}