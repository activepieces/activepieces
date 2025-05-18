import { AppSystemProp, exceptionHandler } from '@activepieces/server-shared'
import { ApEdition, ApEnvironment, BillingEntityType, BillingMetric, getCurrentBillingPeriodEnd, getCurrentBillingPeriodStart, isNil, ProjectUsage } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { getRedisConnection } from '../../../database/redis-connection'
import { projectLimitsService } from '../../../ee/project-plan/project-plan.service'
import { system } from '../../../helper/system/system'
import { platformService } from '../../../platform/platform.service'
import { projectService } from '../../../project/project-service'
import { userInvitationsService } from '../../../user-invitations/user-invitation.service'
import { projectMemberService } from '../../project-members/project-member.service'
import { platformBillingService } from '../platform-billing.service'

const environment = system.get(AppSystemProp.ENVIRONMENT)
const edition = system.getEdition()

const redisKeyGenerator = (entityId: string, entityType: BillingEntityType, startBillingPeriod: string, usageType: BillingMetric): string => {
    return `${entityType}-${entityId}-usage-${usageType}:${startBillingPeriod}`
}

export const usageService = (log: FastifyBaseLogger) => ({
    async getUsageForBillingPeriod(entityId: string, entityType: BillingEntityType): Promise<ProjectUsage> {
        const startBillingPeriod = getCurrentBillingPeriodStart()

        const tasks = await getUsage(entityId, entityType, startBillingPeriod, BillingMetric.TASKS)
        const aiTokens = await getUsage(entityId, entityType, startBillingPeriod, BillingMetric.AI_TOKENS)
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
        return checkUsageLimit({
            projectId,
            incrementBy: 0,
            usageType: BillingMetric.TASKS,
            log,
        })
    },

    async aiTokensExceededLimit(projectId: string, tokensToConsume: number): Promise<boolean> {
        return checkUsageLimit({
            projectId,
            incrementBy: tokensToConsume,
            usageType: BillingMetric.AI_TOKENS,
            log,
        })
    },

    increaseProjectAndPlatformUsage,
    getUsage,
})

async function checkUsageLimit({ projectId, incrementBy, usageType, log }: { projectId: string, incrementBy: number, usageType: BillingMetric, log: FastifyBaseLogger }): Promise<boolean> {
    if (![ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
        return false
    }

    try {
        const projectPlan = await projectLimitsService.getPlanByProjectId(projectId)

        if (!projectPlan) {
            return false
        }

        const platformId = await projectService.getPlatformId(projectId)
        const { consumedProjectUsage, consumedPlatformUsage } = await increaseProjectAndPlatformUsage({ projectId, incrementBy, usageType })
        const planLimit = usageType === BillingMetric.TASKS ? projectPlan.tasks : projectPlan.aiTokens
        const shouldLimitFromProjectPlan = !isNil(planLimit) && consumedProjectUsage >= planLimit

        if (edition === ApEdition.ENTERPRISE) {
            return shouldLimitFromProjectPlan
        }

        const platform = await platformService.getOneOrThrow(platformId)
        const platformBilling = await platformBillingService(log).getOrCreateForPlatform(platformId)
        const platformLimit = usageType === BillingMetric.TASKS ? platformBilling.tasksLimit : platformBilling.aiCreditsLimit
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

async function increaseProjectAndPlatformUsage({ projectId, incrementBy, usageType }: { projectId: string, incrementBy: number, usageType: BillingMetric }): Promise<{ consumedProjectUsage: number, consumedPlatformUsage: number }> {
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

async function getUsage(entityId: string, entityType: BillingEntityType, startBillingPeriod: string, usageType: BillingMetric): Promise<number> {
    if (environment === ApEnvironment.TESTING) {
        return 0
    }

    const redisKey = redisKeyGenerator(entityId, entityType, startBillingPeriod, usageType)
    const redisConnection = getRedisConnection()

    const value = await redisConnection.get(redisKey)
    return Number(value) || 0
}
