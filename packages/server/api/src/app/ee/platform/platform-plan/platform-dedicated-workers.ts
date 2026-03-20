import { ApEdition, isNil, PlatformPlan } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { IsNull, Not } from 'typeorm'
import { distributedStore } from '../../../database/redis-connections'
import { system } from '../../../helper/system/system'
import { platformPlanRepo } from './platform-plan.service'

const edition = system.getEdition()
const getPlatformHasDedicatedWorkersKey = (platformId: string): string => `platform:${platformId}:dedicated_workers`

export const dedicatedWorkers = (_log: FastifyBaseLogger) => ({
    async getPlatformIds(): Promise<string[]> {
        if (edition !== ApEdition.CLOUD) {
            return []
        }

        const platformPlans = await platformPlanRepo().find({
            select: ['platformId'],
            where: {
                dedicatedWorkers: Not(IsNull()),
            },
        })
        const platformIds = platformPlans.map(({ platformId }) => platformId)

        const cacheEntries = platformIds.map(platformId => ({
            key: getPlatformHasDedicatedWorkersKey(platformId),
            value: true,
        }))

        if (cacheEntries.length > 0) {
            await distributedStore.putBooleanBatch(cacheEntries)
        }

        return platformIds
    },
    async isEnabledForPlatform(platformId: string): Promise<boolean> {
        if (edition !== ApEdition.CLOUD) {
            return false
        }

        return await distributedStore.getBoolean(getPlatformHasDedicatedWorkersKey(platformId)) ?? false
    },
    async updateWorkerConfig({ operation, platformId, trustedEnvironment }: UpdateParams): Promise<void> {
        const platformKey = getPlatformHasDedicatedWorkersKey(platformId)
        await platformPlanRepo().update({ platformId }, { dedicatedWorkers: operation === 'enable' ? { trustedEnvironment } : null })
        if (operation === 'enable') {
            await distributedStore.putBoolean(platformKey, true)
        }
        else {
            await distributedStore.delete(platformKey)
        }
    },
    async getWorkerConfig(platformId: string): Promise<PlatformPlan['dedicatedWorkers']> {
        if (edition !== ApEdition.CLOUD) {
            return null
        }

        const platformPlan = await platformPlanRepo().findOneBy({ platformId })
        if (isNil(platformPlan?.dedicatedWorkers)) {
            return null
        }
        return platformPlan.dedicatedWorkers
    },
})


type UpdateParams = {
    operation: 'enable' | 'disable'
    platformId: string
    trustedEnvironment: boolean
}
