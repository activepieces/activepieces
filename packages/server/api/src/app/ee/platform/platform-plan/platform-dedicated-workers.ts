import { ApEdition, isNil, PlatformPlan } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { IsNull, Not } from 'typeorm'
import { distributedStore } from '../../../helper/key-value'
import { system } from '../../../helper/system/system'
import { platformPlanRepo } from './platform-plan.service'

const edition = system.getEdition()
const getPlatformHasDedicatedWorkersKey = (platformId: string): string => `platform:${platformId}:dedicated_workers`

export const dedicatedWorkers = (_log: FastifyBaseLogger) => ({
    async getPlatformIds(): Promise<string[]> {
        if (edition === ApEdition.COMMUNITY) {
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
        if (edition === ApEdition.COMMUNITY) {
            return false
        }

        const isEnabled = await distributedStore.getBoolean(getPlatformHasDedicatedWorkersKey(platformId))
        if (!isNil(isEnabled)) {
            return isEnabled
        }

        const platformPlan = await platformPlanRepo().findOne({ where: { platformId }, select: ['dedicatedWorkers'] })
        if (isNil(platformPlan?.dedicatedWorkers)) {
            await distributedStore.putBoolean(getPlatformHasDedicatedWorkersKey(platformId), false)
            return false
        }

        await distributedStore.putBoolean(getPlatformHasDedicatedWorkersKey(platformId), true)
        return true
    },
    async getWorkerConfig(platformId: string): Promise<PlatformPlan['dedicatedWorkers']> {
        if (edition === ApEdition.COMMUNITY) {
            return null
        }

        const platformPlan = await platformPlanRepo().findOneBy({ platformId })
        if (isNil(platformPlan?.dedicatedWorkers)) {
            return null
        }
        return platformPlan.dedicatedWorkers
    },
})

