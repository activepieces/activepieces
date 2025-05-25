import { AppSystemProp } from '@activepieces/server-shared'
import { ApEdition, ApEnvironment, ProjectUsage } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { getRedisConnection } from '../../database/redis-connection'
import { apDayjs } from '../../helper/dayjs-helper'
import { system } from '../../helper/system/system'
import { projectService } from '../../project/project-service'

export enum BillingUsageType {
    TASKS = 'tasks',
    AI_TOKENS = 'aiTokens',
}

export enum BillingEntityType {
    PROJECT = 'project',
    PLATFORM = 'platform',
}

const environment = system.get(AppSystemProp.ENVIRONMENT)

const redisKeyGenerator = (entityId: string, entityType: BillingEntityType, startBillingPeriod: string, usageType: BillingUsageType): string => {
    return `${entityType}-${entityId}-usage-${usageType}:${startBillingPeriod}`
}

export const usageService = (_log: FastifyBaseLogger) => ({
    async getUsageForBillingPeriod(entityId: string, entityType: BillingEntityType): Promise<ProjectUsage> {
        const startBillingPeriod = this.getCurrentBillingPeriodStart()
        const tasks = await getUsage(entityId, entityType, startBillingPeriod, BillingUsageType.TASKS)
        const aiTokens = await getUsage(entityId, entityType, startBillingPeriod, BillingUsageType.AI_TOKENS)

        return {
            tasks,
            aiTokens,
            nextLimitResetDate: this.getCurrentBillingPeriodEnd(),
        }
    },

    async increaseProjectAndPlatformUsage({ projectId, incrementBy, usageType }: IncreaseProjectAndPlatformUsageParams): Promise<{ consumedProjectUsage: number, consumedPlatformUsage: number }> {
        const edition = system.getEdition()
        if (edition === ApEdition.COMMUNITY || environment === ApEnvironment.TESTING) {
            return { consumedProjectUsage: 0, consumedPlatformUsage: 0 }
        }

        const redisConnection = getRedisConnection()
        const startBillingPeriod = this.getCurrentBillingPeriodStart()

        const projectRedisKey = redisKeyGenerator(projectId, BillingEntityType.PROJECT, startBillingPeriod, usageType)
        const consumedProjectUsage = await redisConnection.incrby(projectRedisKey, incrementBy)

        const platformId = await projectService.getPlatformId(projectId)
        const platformRedisKey = redisKeyGenerator(platformId, BillingEntityType.PLATFORM, startBillingPeriod, usageType)
        const consumedPlatformUsage = await redisConnection.incrby(platformRedisKey, incrementBy)

        return { consumedProjectUsage, consumedPlatformUsage }
    },

    getCurrentBillingPeriodStart(): string {
        return apDayjs().startOf('month').toISOString()
    },

    getCurrentBillingPeriodEnd(): string {
        return apDayjs().endOf('month').toISOString()
    },
})

async function getUsage(entityId: string, entityType: BillingEntityType, startBillingPeriod: string, usageType: BillingUsageType): Promise<number> {
    if (environment === ApEnvironment.TESTING) {
        return 0
    }

    const redisKey = redisKeyGenerator(entityId, entityType, startBillingPeriod, usageType)
    const redisConnection = getRedisConnection()

    const value = await redisConnection.get(redisKey)
    return Number(value) || 0
}

type IncreaseProjectAndPlatformUsageParams = {
    projectId: string
    incrementBy: number
    usageType: BillingUsageType
}
