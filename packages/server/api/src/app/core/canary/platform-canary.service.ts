import { isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { distributedStore } from '../../database/redis-connections'
import { platformPlanRepo, platformPlanService } from '../../ee/platform/platform-plan/platform-plan.service'

const CANARY_PLATFORM_IDS_KEY = 'canary-platform-ids'

export const platformCanaryService = (log: FastifyBaseLogger) => ({
    async getCanaryPlatformIds(): Promise<string[]> {
        const cached = await distributedStore.get<string[]>(CANARY_PLATFORM_IDS_KEY)
        if (!isNil(cached)) return cached

        const plans = await platformPlanRepo().find({
            select: ['platformId'],
            where: {
                canary: true,
            },
        })
        const ids = plans.map(({ platformId }) => platformId)
        await distributedStore.put(CANARY_PLATFORM_IDS_KEY, ids)
        return ids
    },
    async updateCanary(platformId: string, canary: boolean): Promise<void> {
        await platformPlanService(log).update({ platformId, canary })
        await distributedStore.delete(CANARY_PLATFORM_IDS_KEY)
    },
    async disableAll(): Promise<void> {
        await platformPlanRepo().update({ canary: true }, { canary: false })
        await distributedStore.delete(CANARY_PLATFORM_IDS_KEY)
    },
})
