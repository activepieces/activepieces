import { memoryLock } from '@activepieces/server-utils'
import { isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { platformPlanRepo, platformPlanService } from '../../ee/platform/platform-plan/platform-plan.service'

const CANARY_PLATFORM_IDS_KEY = 'canary-platform-ids'

let cachedIds: string[] | null = null

export const platformCanaryService = (log: FastifyBaseLogger) => ({
    async shouldForwardToCanary({ platformId }: { platformId: string }): Promise<boolean> {
        const ids = await getCanaryPlatformIds()
        return ids.includes(platformId)
    },
    async updateCanary({ platformId, canary }: { platformId: string, canary: boolean }): Promise<void> {
        await platformPlanService(log).update({ platformId, canary })
        cachedIds = null
    },
    async disableAll(): Promise<void> {
        await platformPlanRepo().update({ canary: true }, { canary: false })
        cachedIds = null
    },
})

async function getCanaryPlatformIds(): Promise<string[]> {
    if (!isNil(cachedIds)) return cachedIds

    return memoryLock.runExclusive({
        key: CANARY_PLATFORM_IDS_KEY,
        fn: async () => {
            if (!isNil(cachedIds)) return cachedIds

            const plans = await platformPlanRepo().find({
                select: ['platformId'],
                where: { canary: true },
            })
            cachedIds = plans.map(({ platformId }) => platformId)
            return cachedIds
        },
    })
}
