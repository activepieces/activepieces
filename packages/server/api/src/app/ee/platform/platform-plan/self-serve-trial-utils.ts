import { isNil } from '@activepieces/core-utils'
import { PlanName, SelfServeTrialDates } from '@activepieces/shared'
import { type GetCustomerResponse } from 'autumn-js'
import { getSelfServeTrialCacheKey, SELF_SERVE_TRIAL_CACHE_TTL_SECONDS } from '../../../database/redis/keys'
import { distributedStore } from '../../../database/redis-connections'

export const selfServeTrialUtils = {
    async readCachedTrial(platformId: string): Promise<CachedSelfServeTrial | null> {
        return distributedStore.get<CachedSelfServeTrial>(getSelfServeTrialCacheKey(platformId))
    },
    async cacheTrialDates({ platformId, dates }: CacheTrialDatesParams): Promise<void> {
        await distributedStore.put(getSelfServeTrialCacheKey(platformId), { dates }, SELF_SERVE_TRIAL_CACHE_TTL_SECONDS)
    },
    async cacheTrialDatesFromCustomer({ platformId, customer }: CacheTrialDatesFromCustomerParams): Promise<SelfServeTrialDates | null> {
        const dates = trialDatesFromCustomer(customer)
        if (!isNil(dates)) {
            await selfServeTrialUtils.cacheTrialDates({ platformId, dates })
            return dates
        }
        return selfServeTrialUtils.cacheNoTrialUnlessAlreadyCached(platformId)
    },
    async cacheNoTrialUnlessAlreadyCached(platformId: string): Promise<SelfServeTrialDates | null> {
        const wroteNoTrial = await distributedStore.putIfAbsent(getSelfServeTrialCacheKey(platformId), { dates: null }, SELF_SERVE_TRIAL_CACHE_TTL_SECONDS)
        if (wroteNoTrial) {
            return null
        }
        return (await selfServeTrialUtils.readCachedTrial(platformId))?.dates ?? null
    },
    async deleteCachedTrial(platformId: string): Promise<void> {
        await distributedStore.delete(getSelfServeTrialCacheKey(platformId))
    },
}

function trialDatesFromCustomer(customer: GetCustomerResponse): SelfServeTrialDates | null {
    const addOn = customer.subscriptions.find((subscription) =>
        subscription.planId === PlanName.ENTERPRISE_TRIAL
        && subscription.status === 'active'
        && !isNil(subscription.trialEndsAt))
    if (!isNil(addOn) && !isNil(addOn.trialEndsAt)) {
        return { startedAt: new Date(addOn.startedAt).toISOString(), endsAt: new Date(addOn.trialEndsAt).toISOString() }
    }
    const metadata: Record<string, unknown> = customer.metadata ?? {}
    const startedAt = Date.parse(String(metadata[TRIAL_STARTED_AT_METADATA_KEY] ?? ''))
    const endsAt = Date.parse(String(metadata[TRIAL_ENDS_AT_METADATA_KEY] ?? ''))
    if (Number.isNaN(startedAt) || Number.isNaN(endsAt) || endsAt <= startedAt) {
        return null
    }
    return { startedAt: new Date(startedAt).toISOString(), endsAt: new Date(endsAt).toISOString() }
}

const TRIAL_STARTED_AT_METADATA_KEY = 'self_serve_trial_started_at'

const TRIAL_ENDS_AT_METADATA_KEY = 'self_serve_trial_ends_at'

type CacheTrialDatesParams = {
    platformId: string
    dates: SelfServeTrialDates | null
}

type CacheTrialDatesFromCustomerParams = {
    platformId: string
    customer: GetCustomerResponse
}

export type CachedSelfServeTrial = {
    dates: SelfServeTrialDates | null
}
