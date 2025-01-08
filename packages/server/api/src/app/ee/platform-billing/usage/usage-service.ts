import { exceptionHandler } from '@activepieces/server-shared'
import { ApEdition, ApEnvironment, isNil, ProjectUsage } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { getRedisConnection } from '../../../database/redis-connection'
import { projectLimitsService } from '../../../ee/project-plan/project-plan.service'
import { apDayjs } from '../../../helper/dayjs-helper'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-prop'
import { projectService } from '../../../project/project-service'
import { userInvitationsService } from '../../../user-invitations/user-invitation.service'
import { projectMemberService } from '../../project-members/project-member.service'
import { platformBillingService } from '../platform-billing.service'

export enum BillingUsageType {
    TASKS = 'tasks',
    AI_TOKENS = 'aiTokens',
}

export enum BillingEntityType {
    PROJECT = 'project',
    PLATFORM = 'platform',
}

const environment = system.get(AppSystemProp.ENVIRONMENT)
const edition = system.getEdition()

const redisKeyGenerator = (entityId: string, entityType: BillingEntityType, startBillingPeriod: string, usageType: BillingUsageType): string => {
    return `${entityType}-${entityId}-usage-${usageType}:${startBillingPeriod}`
}

export const usageService = (log: FastifyBaseLogger) => ({
    async getUsageForBillingPeriod(entityId: string, entityType: BillingEntityType): Promise<ProjectUsage> {
        const startBillingPeriod = getCurrentBillingPeriodStart()
        const tasks = await getUsage(entityId, entityType, startBillingPeriod, BillingUsageType.TASKS)
        const aiTokens = await getUsage(entityId, entityType, startBillingPeriod, BillingUsageType.AI_TOKENS)
        const teamMembers = entityType === BillingEntityType.PROJECT ?
            await projectMemberService(log).countTeamMembers(entityId) +
            await userInvitationsService(log).countByProjectId(entityId) :
            0

        return {
            tasks,
            aiTokens,
            teamMembers,
            nextLimitResetDate: getCurrentBillingPeriodEnd(),
        }
    },

    async aiTokensExceededLimit(projectId: string, tokensToConsume: number): Promise<boolean> {
        if (![ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
            return false
        }

        try {
            const projectPlan = await projectLimitsService.getPlanByProjectId(projectId)
            if (!projectPlan) {
                return false
            }
            const platformId = await projectService.getPlatformId(projectId)
            return await checkProjectTokensExceeded(projectId, tokensToConsume, projectPlan.aiTokens) || await checkPlatformTokensExceeded(log, platformId, tokensToConsume)
        }
        catch (e) {
            exceptionHandler.handle(e, log)
            throw e
        }
    },

    async tasksExceededLimit(projectId: string): Promise<boolean> {
        if (![ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
            return false
        }

        try {
            const projectPlan = await projectLimitsService.getPlanByProjectId(projectId)
            if (!projectPlan) {
                return false
            }

            const platformId = await projectService.getPlatformId(projectId)
            return await checkProjectTasksExceeded(projectId, projectPlan.tasks) || await checkPlatformTasksExceeded(log, platformId)
        }
        catch (e) {
            exceptionHandler.handle(e, log)
            return false
        }
    },
    increaseProjectAndPlatformUsage,
    getCurrentBillingPeriodStart,
    getCurrentBillingPeriodEnd,
    getUsage,
})

async function checkProjectTokensExceeded(projectId: string, tokensToConsume: number, tokenLimit: number): Promise<boolean> {
    const consumedProjectTokens = await increaseProjectAndPlatformUsage(projectId, tokensToConsume, BillingUsageType.AI_TOKENS)
    console.log('consumedProjectTokens', consumedProjectTokens + ' ' + tokenLimit)
    return consumedProjectTokens >= tokenLimit
}

async function checkPlatformTokensExceeded(log: FastifyBaseLogger, platformId: string, tokensToConsume: number): Promise<boolean> {
    if (edition !== ApEdition.CLOUD) {
        return false
    }
    const platformBilling = await platformBillingService(log).getOrCreateForPlatform(platformId)
    const consumedPlatformTokens = await increaseProjectAndPlatformUsage(platformId, tokensToConsume, BillingUsageType.AI_TOKENS)
    if (isNil(platformBilling.aiCreditsLimit)) {
        return false
    }
    console.log('consumedPlatformTokens', consumedPlatformTokens + ' ' + platformBilling.aiCreditsLimit)
    return consumedPlatformTokens >= platformBilling.aiCreditsLimit
}

async function checkProjectTasksExceeded(projectId: string, taskLimit: number): Promise<boolean> {
    const consumedProjectTasks = await increaseProjectAndPlatformUsage(projectId, 0, BillingUsageType.TASKS)
    return consumedProjectTasks >= taskLimit
}

async function checkPlatformTasksExceeded(log: FastifyBaseLogger, platformId: string): Promise<boolean> {
    if (edition !== ApEdition.CLOUD) {
        return false
    }
    const platformBilling = await platformBillingService(log).getOrCreateForPlatform(platformId)
    const consumedPlatformTasks = await increaseProjectAndPlatformUsage(platformId, 0, BillingUsageType.TASKS)
    if (isNil(platformBilling.tasksLimit)) {
        return false
    }
    return consumedPlatformTasks >= platformBilling.tasksLimit
}

async function increaseProjectAndPlatformUsage(projectId: string, incrementBy: number, usageType: BillingUsageType): Promise<number> {
    const edition = system.getEdition()
    if (edition === ApEdition.COMMUNITY || environment === ApEnvironment.TESTING) {
        return 0
    }

    const redisConnection = getRedisConnection()
    const startBillingPeriod = getCurrentBillingPeriodStart()

    const projectRedisKey = redisKeyGenerator(projectId, BillingEntityType.PROJECT, startBillingPeriod, usageType)
    const projectUsage = await redisConnection.incrby(projectRedisKey, incrementBy)

    const platformId = await projectService.getPlatformId(projectId)
    const platformRedisKey = redisKeyGenerator(platformId, BillingEntityType.PLATFORM, startBillingPeriod, usageType)
    await redisConnection.incrby(platformRedisKey, incrementBy)

    return projectUsage
}

async function getUsage(entityId: string, entityType: BillingEntityType, startBillingPeriod: string, usageType: BillingUsageType): Promise<number> {
    if (environment === ApEnvironment.TESTING) {
        return 0
    }

    const redisKey = redisKeyGenerator(entityId, entityType, startBillingPeriod, usageType)
    const redisConnection = getRedisConnection()

    const value = await redisConnection.get(redisKey)
    return Number(value) || 0
}

function getCurrentBillingPeriodStart(): string {
    return apDayjs().startOf('month').toISOString()
}

function getCurrentBillingPeriodEnd(): string {
    return apDayjs().endOf('month').toISOString()
}
