import { isNil } from '@activepieces/core-utils'
import { PlanName, SelfServeTrialDates } from '@activepieces/shared'
import { type GetCustomerResponse, type ListSubscriptionsList, ListSubscriptionsListStatus } from 'autumn-js'
import { getSelfServeTrialDatesCacheKey, SELF_SERVE_TRIAL_DATES_CACHE_TTL_SECONDS } from '../../../database/redis/keys'
import { distributedStore } from '../../../database/redis-connections'

export const selfServeTrialUtils = {
    async readCachedTrialDates(platformId: string): Promise<CachedSelfServeTrial | null> {
        return distributedStore.get<CachedSelfServeTrial>(getSelfServeTrialDatesCacheKey(platformId))
    },
    async cacheTrialDates({ platformId, dates }: CacheTrialDatesParams): Promise<void> {
        await distributedStore.put(getSelfServeTrialDatesCacheKey(platformId), { dates }, SELF_SERVE_TRIAL_DATES_CACHE_TTL_SECONDS)
    },
    async deleteCachedTrial(platformId: string): Promise<void> {
        await distributedStore.delete(getSelfServeTrialDatesCacheKey(platformId))
    },
    hasHadTrial(customer: GetCustomerResponse): boolean {
        return (customer.trialsUsed ?? []).some((trial) => trial.planId === PlanName.SELF_SERVE_TRIAL)
            || customer.subscriptions.some((subscription) => subscription.planId === PlanName.SELF_SERVE_TRIAL)
    },
    latestTrialDates(subscriptions: ListSubscriptionsList[]): SelfServeTrialDates | null {
        const latest = subscriptions
            .filter((subscription) => subscription.planId === PlanName.SELF_SERVE_TRIAL)
            .reduce<ListSubscriptionsList | null>((newest, subscription) => isNil(newest) || subscription.startedAt > newest.startedAt ? subscription : newest, null)
        if (isNil(latest)) {
            return null
        }
        const endsAt = latest.status === ListSubscriptionsListStatus.Expired ? latest.expiresAt ?? latest.trialEndsAt : latest.trialEndsAt
        if (isNil(endsAt)) {
            return null
        }
        return { startedAt: new Date(latest.startedAt).toISOString(), endsAt: new Date(endsAt).toISOString() }
    },
}

type CacheTrialDatesParams = {
    platformId: string
    dates: SelfServeTrialDates | null
}

export type CachedSelfServeTrial = {
    dates: SelfServeTrialDates | null
}
