import { AppSystemProp } from '@activepieces/server-shared'
import { ApEdition, ApEnvironment, getCurrentBillingPeriodStart, PlatformUsageMetrics, UsageEntityType, UsageMetric  } from '@activepieces/shared'
import { getRedisConnection } from '../../../database/redis-connection'
import { system } from '../../../helper/system/system'
import { getUsage, redisKeyGenerator } from '../../../helper/usage'

const environment = system.get(AppSystemProp.ENVIRONMENT)
const edition = system.getEdition()

export const platformUsageService = {

    async getPlatformUsageForBillingPeriod(platformId: string): Promise<PlatformUsageMetrics> {
        const startBillingPeriod = getCurrentBillingPeriodStart()

        const tasks = await getUsage(platformId, UsageEntityType.PLATFORM, startBillingPeriod, UsageMetric.TASKS)
        const aiCredits = await getUsage(platformId, UsageEntityType.PLATFORM, startBillingPeriod, UsageMetric.AI_TOKENS)
        const tables = await getUsage(platformId, UsageEntityType.PLATFORM, startBillingPeriod, UsageMetric.TABLES)
        const mcpServers = await getUsage(platformId, UsageEntityType.PLATFORM, startBillingPeriod, UsageMetric.MCP_SERVERS)
        const activeFlows = await getUsage(platformId, UsageEntityType.PLATFORM, startBillingPeriod, UsageMetric.ACTIVE_FLOWS)

        return {
            tasks,
            aiCredits,
            tables,
            mcpServers,
            activeFlows,
        }
    },

    async increasePlatformUsage( platformId: string, incrementBy: number, usageMetric: UsageMetric ): Promise<number> {

        if (edition === ApEdition.COMMUNITY || environment === ApEnvironment.TESTING) {
            return 0
        }

        const redisConnection = getRedisConnection()
        const startBillingPeriod = getCurrentBillingPeriodStart()

        const platformRedisKey = redisKeyGenerator(platformId, UsageEntityType.PLATFORM, startBillingPeriod, usageMetric)
        const consumedPlatformUsage = await redisConnection.incrby(platformRedisKey, incrementBy)

        return consumedPlatformUsage
    },
}



