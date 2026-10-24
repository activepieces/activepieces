import { isNil } from '@activepieces/core-utils'
import { PlanName, SelfServeTrialDates } from '@activepieces/shared'
import { type GetCustomerResponse } from 'autumn-js'
import { getSelfServeTrialDatesCacheKey, SELF_SERVE_TRIAL_DATES_CACHE_TTL_SECONDS } from '../../../database/redis/keys'
import { distributedStore } from '../../../database/redis-connections'

export const selfServeTrialUtils = {
    async readCachedTrialDates(platformId: string): Promise<CachedSelfServeTrial | null> {
        return distributedStore.get<CachedSelfServeTrial>(getSelfServeTrialDatesCacheKey(platformId))
    },
    async cacheTrialDates({ platformId, dates }: CacheTrialDatesParams): Promise<void> {
        await distributedStore.put(getSelfServeTrialDatesCacheKey(platformId), { dates }, SELF_SERVE_TRIAL_DATES_CACHE_TTL_SECONDS)
    },
    async syncTrialDatesFromAutumn({ platformId, customer }: SyncTrialDatesFromAutumnParams): Promise<SelfServeTrialDates | null> {
        const dates = trialDatesFromAutumn(customer)
        if (!isNil(dates)) {
            await selfServeTrialUtils.cacheTrialDates({ platformId, dates })
            return dates
        }
        return selfServeTrialUtils.cacheNoTrialUnlessAlreadyCached(platformId)
    },
    async cacheNoTrialUnlessAlreadyCached(platformId: string): Promise<SelfServeTrialDates | null> {
        const wroteNoTrial = await distributedStore.putIfAbsent(getSelfServeTrialDatesCacheKey(platformId), { dates: null }, SELF_SERVE_TRIAL_DATES_CACHE_TTL_SECONDS)
        if (wroteNoTrial) {
            return null
        }
        return (await selfServeTrialUtils.readCachedTrialDates(platformId))?.dates ?? null
    },
    async deleteCachedTrial(platformId: string): Promise<void> {
        await distributedStore.delete(getSelfServeTrialDatesCacheKey(platformId))
    },
}

function trialDatesFromAutumn(customer: GetCustomerResponse): SelfServeTrialDates | null {
    const addOn = customer.subscriptions.find((subscription) =>
        subscription.planId === PlanName.ENTERPRISE_TRIAL
        && subscription.status === 'active'
        && !isNil(subscription.trialEndsAt))
    if (!isNil(addOn) && !isNil(addOn.trialEndsAt)) {
        return { startedAt: new Date(addOn.startedAt).toISOString(), endsAt: new Date(addOn.trialEndsAt).toISOString() }
    }
    const metadata: Record<string, unknown> = customer.metadata ?? {}
    const startedAt = Date.parse(String(metadata[AUTUMN_METADATA_TRIAL_STARTED_AT] ?? ''))
    const endsAt = Date.parse(String(metadata[AUTUMN_METADATA_TRIAL_ENDS_AT] ?? ''))
    if (Number.isNaN(startedAt) || Number.isNaN(endsAt) || endsAt <= startedAt) {
        return null
    }
    return { startedAt: new Date(startedAt).toISOString(), endsAt: new Date(endsAt).toISOString() }
}

const AUTUMN_METADATA_TRIAL_STARTED_AT = 'self_serve_trial_started_at'

const AUTUMN_METADATA_TRIAL_ENDS_AT = 'self_serve_trial_ends_at'

type CacheTrialDatesParams = {
    platformId: string
    dates: SelfServeTrialDates | null
}

type SyncTrialDatesFromAutumnParams = {
    platformId: string
    customer: GetCustomerResponse
}

export type CachedSelfServeTrial = {
    dates: SelfServeTrialDates | null
}
