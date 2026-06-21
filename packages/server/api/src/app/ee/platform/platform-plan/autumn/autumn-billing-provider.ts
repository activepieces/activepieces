import { isNil } from '@activepieces/core-utils'
import { AUTUMN_FEATURE } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { getCreditTrackedKey } from '../../../../database/redis/keys'
import { distributedStore } from '../../../../database/redis-connections'
import { BillingProvider, TrackCreditsParams } from '../../../../platform/billing-provider'
import { platformPlanService } from '../platform-plan.service'
import { refreshEntitlements } from './autumn-entitlements'
import { resolveAutumnClientForPlatform } from './autumn-platform-client'
import { writeCreditsBalance } from './credits-cache'

const CREDIT_DEDUP_TTL_SECONDS = 86400

export const autumnBillingProvider = (log: FastifyBaseLogger): BillingProvider => ({
    trackCredits: async (params: TrackCreditsParams) => {
        const dedupKey = getCreditTrackedKey(params.idempotencyKey)
        const reserved = await distributedStore.putIfAbsent(dedupKey, '1', CREDIT_DEDUP_TTL_SECONDS)
        if (!reserved) {
            return
        }
        try {
            const client = await resolveAutumnClientForPlatform(log, params.platformId)
            if (isNil(client)) {
                return
            }
            const response = await client.track({
                featureId: AUTUMN_FEATURE.CREDITS,
                value: params.value,
                idempotencyKey: params.idempotencyKey,
                properties: { source: params.source, ...params.properties },
            })
            if (!isNil(response.balance)) {
                await writeCreditsBalance(params.platformId, response.balance)
            }
        }
        catch (error) {
            await distributedStore.delete(dedupKey)
            throw error
        }
    },
    refreshEntitlements: async (platformId: string) => {
        await refreshEntitlements(log, platformId)
    },
    shouldBlock: async (platformId: string) => {
        const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
        return platformPlan.billingEnforced === true
    },
})
