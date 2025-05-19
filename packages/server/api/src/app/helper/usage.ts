import { AppSystemProp } from '@activepieces/server-shared'
import { ApEnvironment, UsageEntityType, UsageMetric } from '@activepieces/shared'
import { getRedisConnection } from '../database/redis-connection'
import { system } from './system/system'

const environment = system.get(AppSystemProp.ENVIRONMENT)



export const redisMetricHelper = {
    getUsage: async (entityId: string, entityType: UsageEntityType, startBillingPeriod: string, usageType: UsageMetric): Promise<number> => {
        if (environment === ApEnvironment.TESTING) {
            return 0
        }

        const redisKey = redisMetricHelper.generateRedisKey(entityId, entityType, startBillingPeriod, usageType)
        const redisConnection = getRedisConnection()

        const value = await redisConnection.get(redisKey)
        return Number(value) || 0
    },


    generateRedisKey: (entityId: string, entityType: UsageEntityType, startBillingPeriod: string, usageType: UsageMetric): string => {
        return `${entityType}-${entityId}-usage-${usageType}:${startBillingPeriod}`
    },

}

