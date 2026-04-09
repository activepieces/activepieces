import { isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { distributedStore } from '../../../database/redis-connections'
import { platformPlanRepo } from './platform-plan.service'

const CANARY_WORKER_GROUP_ID = 'canary'
const getWorkerGroupCacheKey = (platformId: string): string => `platform:${platformId}:worker_group_id`

export const workerGroupService = (_log: FastifyBaseLogger) => ({
    async getWorkerGroupId({ platformId }: { platformId: string }): Promise<string | null> {
        const cached = await distributedStore.get<string>(getWorkerGroupCacheKey(platformId))
        if (!isNil(cached)) {
            return cached
        }

        const plan = await platformPlanRepo().findOne({
            select: ['workerGroupId'],
            where: { platformId },
        })

        const groupId = plan?.workerGroupId ?? null
        if (!isNil(groupId)) {
            await distributedStore.put(getWorkerGroupCacheKey(platformId), groupId)
        }
        return groupId
    },

    async isCanaryPlatform({ platformId }: { platformId: string }): Promise<boolean> {
        const groupId = await this.getWorkerGroupId({ platformId })
        return groupId === CANARY_WORKER_GROUP_ID
    },

    async updateWorkerGroup({ platformId, workerGroupId }: { platformId: string, workerGroupId: string | null }): Promise<void> {
        await platformPlanRepo().update({ platformId }, { workerGroupId })
        await distributedStore.delete(getWorkerGroupCacheKey(platformId))
    },

    async updateCanary({ platformId, canary }: { platformId: string, canary: boolean }): Promise<void> {
        const workerGroupId = canary ? CANARY_WORKER_GROUP_ID : null
        await platformPlanRepo().update({ platformId }, { workerGroupId })
        await distributedStore.delete(getWorkerGroupCacheKey(platformId))
    },

    async disableAllCanary(): Promise<void> {
        const plans = await platformPlanRepo().find({
            select: ['platformId'],
            where: { workerGroupId: CANARY_WORKER_GROUP_ID },
        })
        await platformPlanRepo().update({ workerGroupId: CANARY_WORKER_GROUP_ID }, { workerGroupId: null })

        for (const plan of plans) {
            await distributedStore.delete(getWorkerGroupCacheKey(plan.platformId))
        }
    },
})
