import { AppSystemProp, exceptionHandler } from '@activepieces/server-shared'
import { ApEdition, ApEnvironment, isNil, ProjectUsage } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { getRedisConnection } from '../../../database/redis-connection'
import { projectLimitsService } from '../../../ee/project-plan/project-plan.service'
import { flagService } from '../../../flags/flag.service'
import { apDayjs } from '../../../helper/dayjs-helper'
import { system } from '../../../helper/system/system'
import { platformService } from '../../../platform/platform.service'
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
            const { consumedProjectUsage, consumedPlatformUsage } = await increaseProjectAndPlatformUsage({ projectId, incrementBy: 0, usageType: BillingUsageType.TASKS })
            // TODO (@abuaboud) clean once project billing is deprecated
            const shouldLimitFromProjectPlan = !isNil(projectPlan.tasks) && consumedProjectUsage >= projectPlan.tasks
            if (flagService.isCloudPlatform(platformId)) {
                return shouldLimitFromProjectPlan
            }
            const platformBilling = await platformBillingService(log).getOrCreateForPlatform(platformId)
            const shouldLimitFromPlatformBilling = !isNil(platformBilling.tasksLimit) && consumedPlatformUsage >= platformBilling.tasksLimit
            const platform = await platformService.getOneOrThrow(platformId)
            if (!platform.manageProjectsEnabled) {
                return shouldLimitFromPlatformBilling
            }
            return shouldLimitFromProjectPlan || shouldLimitFromPlatformBilling
        }
        catch (e) {
            exceptionHandler.handle(e, log)
            return false
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
            const { consumedProjectUsage, consumedPlatformUsage } = await increaseProjectAndPlatformUsage({ projectId, incrementBy: tokensToConsume, usageType: BillingUsageType.AI_TOKENS })
            // TODO (@abuaboud) clean once project billing is deprecated
            const shouldLimitFromProjectPlan = !isNil(projectPlan.aiTokens) && consumedProjectUsage >= projectPlan.aiTokens
            if (flagService.isCloudPlatform(platformId)) {
                return shouldLimitFromProjectPlan
            }
            const platformBilling = await platformBillingService(log).getOrCreateForPlatform(platformId)
            const shouldLimitFromPlatformBilling = !isNil(platformBilling.aiCreditsLimit) && consumedPlatformUsage >= platformBilling.aiCreditsLimit
            const platform = await platformService.getOneOrThrow(platformId)
            if (!platform.manageProjectsEnabled) {
                return shouldLimitFromPlatformBilling
            }
            return shouldLimitFromProjectPlan || shouldLimitFromPlatformBilling
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


async function increaseProjectAndPlatformUsage({ projectId, incrementBy, usageType }: { projectId: string, incrementBy: number, usageType: BillingUsageType }): Promise<{ consumedProjectUsage: number, consumedPlatformUsage: number }> {
    const edition = system.getEdition()
    if (edition === ApEdition.COMMUNITY || environment === ApEnvironment.TESTING) {
        return { consumedProjectUsage: 0, consumedPlatformUsage: 0 }
    }

    const redisConnection = getRedisConnection()
    const startBillingPeriod = getCurrentBillingPeriodStart()

    const projectRedisKey = redisKeyGenerator(projectId, BillingEntityType.PROJECT, startBillingPeriod, usageType)
    const consumedProjectUsage = await redisConnection.incrby(projectRedisKey, incrementBy)

    const platformId = await projectService.getPlatformId(projectId)
    const platformRedisKey = redisKeyGenerator(platformId, BillingEntityType.PLATFORM, startBillingPeriod, usageType)
    const consumedPlatformUsage = await redisConnection.incrby(platformRedisKey, incrementBy)

    return { consumedProjectUsage, consumedPlatformUsage }
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
