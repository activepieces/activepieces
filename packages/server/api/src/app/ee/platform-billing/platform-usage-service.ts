import { getCurrentBillingPeriodStart, PlatformUsageMetrics, UsageEntityType, UsageMetric  } from '@activepieces/shared'
import { redisMetricHelper } from '../../helper/usage'

export const platformUsageService = {

    async getPlatformUsageForBillingPeriod(platformId: string): Promise<PlatformUsageMetrics> {
        const startBillingPeriod = getCurrentBillingPeriodStart()

        const tasks = await redisMetricHelper.getUsage(platformId, UsageEntityType.PLATFORM, startBillingPeriod, UsageMetric.TASKS)
        const aiCredits = await redisMetricHelper.getUsage(platformId, UsageEntityType.PLATFORM, startBillingPeriod, UsageMetric.AI_CREDIT)
        const tables = await redisMetricHelper.getUsage(platformId, UsageEntityType.PLATFORM, startBillingPeriod, UsageMetric.TABLES)
        const mcpServers = await redisMetricHelper.getUsage(platformId, UsageEntityType.PLATFORM, startBillingPeriod, UsageMetric.MCP_SERVERS)
        const activeFlows = await redisMetricHelper.getUsage(platformId, UsageEntityType.PLATFORM, startBillingPeriod, UsageMetric.ACTIVE_FLOWS)

        return {
            tasks,
            aiCredits,
            tables,
            mcpServers,
            activeFlows,
        }
    },
}



