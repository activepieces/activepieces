import { getCurrentBillingPeriodStart, PlatformUsageMetrics, UsageEntityType, UsageMetric  } from '@activepieces/shared'
import { getUsage } from '../../helper/usage'

export const platformUsageService = {

    async getPlatformUsageForBillingPeriod(platformId: string): Promise<PlatformUsageMetrics> {
        const startBillingPeriod = getCurrentBillingPeriodStart()

        const tasks = await getUsage(platformId, UsageEntityType.PLATFORM, startBillingPeriod, UsageMetric.TASKS)
        const aiCredits = await getUsage(platformId, UsageEntityType.PLATFORM, startBillingPeriod, UsageMetric.AI_CREDIT)
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
}



