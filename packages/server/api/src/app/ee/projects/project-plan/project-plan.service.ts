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
        const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
        return {
            ...projectPlan,
            ...getProjectLimits(projectPlan, platformPlan),
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

            const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
            const { startDate, endDate } = await platformPlanService(system.globalLogger()).getBillingDates(platformPlan)

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

        const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
        const { startDate, endDate } = await platformPlanService(system.globalLogger()).getBillingDates(platformPlan)

        const projectAICreditUsage = await platformUsageService(log).getProjectUsage({ projectId, metric: 'ai_credits', startDate, endDate })
        const platformAICreditUsage = await platformUsageService(log).getPlatformUsage({ platformId, metric: 'ai_credits', startDate, endDate })

        const aiCreditPlatformLimit = await platformReachedLimit({ platformId, platformUsage: platformAICreditUsage, log, usageType: 'ai_credits' })
        const aiCreditPorjectLimit = await projectReachedLimit({ projectId, manageProjectsEnabled, projectUsage: projectAICreditUsage, log, usageType: 'ai_credits' })

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
    const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)

    const isOverageEnabled = platformPlan.aiCreditsOverageEnabled ?? false
    
    const platformLimit = usageType === 'tasks'
        ? platformPlan.tasksLimit
        : platformPlan.aiCreditsLimit

    if (isNil(platformLimit)) {
        return false
    }

    const totalLimit = usageType === 'ai_credits' && isOverageEnabled
        ? platformLimit + (platformPlan.aiCreditsOverageLimit ?? 0)
        : platformLimit

    return platformUsage >= totalLimit

}

function getProjectLimits(projectPlan: ProjectPlan, platformPlan: PlatformPlan): { tasks: number | undefined, aiCredits: number | undefined } {
    const isOverageEnabled = platformPlan.aiCreditsOverageEnabled ?? false

    if (!platformPlan.manageProjectsEnabled) {
        return {
            aiCredits: isOverageEnabled ? ((platformPlan.aiCreditsOverageLimit ?? 0) + platformPlan.aiCreditsLimit) : platformPlan.aiCreditsLimit,
            tasks: platformPlan?.tasksLimit,
        }
    }

    return {
        tasks: projectPlan.tasks ?? platformPlan?.tasksLimit,
        aiCredits: projectPlan.aiCredits ?? isOverageEnabled ? ((platformPlan.aiCreditsOverageLimit ?? 0) + platformPlan.aiCreditsLimit) : platformPlan?.aiCreditsLimit,
    }

}

type LimitReachedFromProjectPlanParams = {
    projectId: string
    manageProjectsEnabled: boolean
    usageType: 'tasks' | 'ai_credits'
    log: FastifyBaseLogger
    projectUsage: number
}

type LimitReachedFromPlatformBillingParams = {
    platformId: string
    usageType: 'tasks' | 'ai_credits' 
    log: FastifyBaseLogger
    platformUsage: number
}