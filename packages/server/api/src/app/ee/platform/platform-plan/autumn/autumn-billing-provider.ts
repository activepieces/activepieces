import { isNil } from '@activepieces/core-utils'
import { AUTUMN_FEATURE } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { BillingProvider, TrackCreditsParams } from '../../../../platform/billing-provider'
import { platformPlanService } from '../platform-plan.service'
import { refreshEntitlements } from './autumn-entitlements'
import { resolveAutumnClientForPlatform } from './autumn-platform-client'

export const autumnBillingProvider = (log: FastifyBaseLogger): BillingProvider => ({
    trackCredits: async (params: TrackCreditsParams) => {
        const client = await resolveAutumnClientForPlatform(log, params.platformId)
        if (isNil(client)) {
            return
        }
        await client.track({
            featureId: AUTUMN_FEATURE.CREDITS,
            value: params.value,
            idempotencyKey: params.idempotencyKey,
            properties: { source: params.source, ...params.properties },
        })
    },
    refreshEntitlements: async (platformId: string) => {
        await refreshEntitlements(log, platformId)
    },
    shouldBlock: async (platformId: string) => {
        const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
        return platformPlan.billingEnforced === true
    },
})
