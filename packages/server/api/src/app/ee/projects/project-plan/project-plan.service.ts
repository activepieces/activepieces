import { FlowPlanLimits, PlatformBilling } from '@activepieces/ee-shared'
import { exceptionHandler } from '@activepieces/server-shared'
import {
    ApEdition,
    apId,
    isNil,
    PiecesFilterType, Platform, ProjectPlan,
    spreadIfDefined,
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
        const projectPlan = await getOrCreateDefaultPlan(projectId)
        await projectPlanRepo().update(projectPlan.id, {
            ...spreadIfDefined('tasks', planLimits.tasks),
            ...spreadIfDefined('name', planLimits.nickname),
            ...spreadIfDefined('pieces', planLimits.pieces),
            ...spreadIfDefined('piecesFilterType', planLimits.piecesFilterType),
            ...spreadIfDefined('aiTokens', planLimits.aiTokens),
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
            aiTokens: projectPlan.aiTokens ?? platformBilling?.aiCreditsLimit,
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

async function getOrCreateDefaultPlan(projectId: string): Promise<ProjectPlan> {
    const existingPlan = await projectPlanRepo().findOneBy({ projectId })
    if (!existingPlan) {
        await projectPlanRepo().upsert({
            id: apId(),
            projectId,
            pieces: [],
            piecesFilterType: PiecesFilterType.NONE,
            tasks: null,
            aiTokens: null,
            name: 'free',
        }, ['projectId'])

    }
    return projectPlanRepo().findOneByOrFail({ projectId })
}


async function getPlatformBillingOnCloudAndManageIsOff(platformId: string, log: FastifyBaseLogger): Promise<PlatformBilling | undefined> {
    if (edition !== ApEdition.CLOUD) {
        return undefined
    }
    const platform = await platformService.getOneOrThrow(platformId)
    if (platform.manageProjectsEnabled) {
        return undefined
    }
    return platformBillingService(log).getOrCreateForPlatform(platformId)
}

async function checkUsageLimit({ projectId, incrementBy, usageType, log }: CheckUsageLimitParams): Promise<boolean> {
    if (edition === ApEdition.COMMUNITY) {
        return false
    }
    try {
        const projectPlan = await getOrCreateDefaultPlan(projectId)
        if (!projectPlan) {
            return false
        }
        const platformId = await projectService.getPlatformId(projectId)
        const platform = await platformService.getOneOrThrow(platformId)
        const { consumedProjectUsage, consumedPlatformUsage } = await usageService(log).increaseProjectAndPlatformUsage({ projectId, incrementBy, usageType })
        const limitProject = await limitReachedFromProjectPlan({ projectId, platform, usageType, consumedProjectUsage, log })
        const limitPlatform = await limitReachedFromPlatformBilling({ platformId, usageType, consumedPlatformUsage, log })
        return limitProject || limitPlatform
    }
    catch (e) {
        exceptionHandler.handle(e, log)
        return false
    }
}


async function limitReachedFromProjectPlan(params: LimitReachedFromProjectPlanParams): Promise<boolean> {
    const { platform, projectId, usageType, consumedProjectUsage, log } = params
    if (!platform.manageProjectsEnabled) {
        return false
    }
    const projectPlan = await getOrCreateDefaultPlan(projectId)
    const planLimit = getProjectLimit(projectPlan, usageType)
    if (isNil(planLimit)) {
        return false
    }
    return consumedProjectUsage >= planLimit
}

function getProjectLimit(projectPlan: ProjectPlan, usageType: BillingUsageType): number | undefined {
    switch (usageType) {
        case BillingUsageType.TASKS:
            return projectPlan.tasks ?? undefined
        case BillingUsageType.AI_TOKENS:
            return projectPlan.aiTokens ?? undefined
    }
}

async function limitReachedFromPlatformBilling(params: LimitReachedFromPlatformBillingParams): Promise<boolean> {
    const enterprise = edition === ApEdition.ENTERPRISE
    if (enterprise) {
        return false
    }
    const { platformId, usageType, consumedPlatformUsage, log } = params
    const platformBilling = await platformBillingService(log).getOrCreateForPlatform(platformId)
    const platformLimit = getPlatformLimit(platformBilling, usageType)
    if (isNil(platformLimit)) {
        return false
    }
    return consumedPlatformUsage >= platformLimit
}

function getPlatformLimit(platformBilling: PlatformBilling, usageType: BillingUsageType): number | undefined {
    switch (usageType) {
        case BillingUsageType.TASKS:
            return platformBilling.tasksLimit
        case BillingUsageType.AI_TOKENS:
            return platformBilling.aiCreditsLimit
    }
}

type LimitReachedFromProjectPlanParams = {
    projectId: string
    platform: Platform
    usageType: BillingUsageType
    log: FastifyBaseLogger
    consumedProjectUsage: number
}

type LimitReachedFromPlatformBillingParams = {
    platformId: string
    usageType: BillingUsageType
    log: FastifyBaseLogger
    consumedPlatformUsage: number
}

type CheckUsageLimitParams = {
    projectId: string
    incrementBy: number
    usageType: BillingUsageType
    log: FastifyBaseLogger
}
