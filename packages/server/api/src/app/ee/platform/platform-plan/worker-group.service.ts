import { apDayjsDuration } from '@activepieces/server-utils'
import { isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { distributedStore } from '../../../database/redis-connections'
import { getWorkerGroupQueueName, QueueName } from '../../../workers/job'
import { platformQueueMigrationService } from '../../../workers/platform-queue-migration.service'
import { platformPlanRepo } from './platform-plan.service'

export const CANARY_WORKER_GROUP_ID = 'canary'

const NO_WORKER_GROUP_SENTINEL = '__none__'
const CACHE_TTL_SECONDS = apDayjsDuration(5, 'minute').asSeconds()
const getWorkerGroupCacheKey = (platformId: string): string => `platform:${platformId}:worker_group_id`

export const workerGroupService = (log: FastifyBaseLogger) => ({
    async getWorkerGroupId({ platformId }: { platformId: string }): Promise<string | null> {
        const cached = await distributedStore.get<string>(getWorkerGroupCacheKey(platformId))
        if (!isNil(cached)) {
            return cached === NO_WORKER_GROUP_SENTINEL ? null : cached
        }

        const plan = await platformPlanRepo().findOne({
            select: ['workerGroupId'],
            where: { platformId },
        })

        const groupId = plan?.workerGroupId ?? null
        await distributedStore.put(getWorkerGroupCacheKey(platformId), groupId ?? NO_WORKER_GROUP_SENTINEL, CACHE_TTL_SECONDS)
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

    async moveJobsToTargetQueue({ platformId, workerGroupId }: { platformId: string, workerGroupId: string | null }): Promise<void> {
        const currentGroupId = await workerGroupService(log).getWorkerGroupId({ platformId })
        const targetQueue = isNil(workerGroupId) ? QueueName.WORKER_JOBS : getWorkerGroupQueueName(workerGroupId)
        const fromQueueName = isNil(currentGroupId) ? QueueName.WORKER_JOBS : getWorkerGroupQueueName(currentGroupId)
        await platformQueueMigrationService(log).migrateJobs({ fromQueueName, toQueueName: targetQueue, platformId })
    },
})
