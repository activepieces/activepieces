import { isNil } from '@activepieces/core-utils'
import { PlanName, SelfServeTrialDates } from '@activepieces/shared'
import { type GetCustomerResponse } from 'autumn-js'
import { getSelfServeTrialKey, SELF_SERVE_TRIAL_TTL_SECONDS } from '../../../database/redis/keys'
import { distributedStore } from '../../../database/redis-connections'

export const selfServeTrialUtils = {
    async read(platformId: string): Promise<CachedSelfServeTrial | null> {
        return distributedStore.get<CachedSelfServeTrial>(getSelfServeTrialKey(platformId))
    },
    async save({ platformId, dates }: SaveSelfServeTrialParams): Promise<void> {
        await distributedStore.put(getSelfServeTrialKey(platformId), { dates }, SELF_SERVE_TRIAL_TTL_SECONDS)
    },
    async saveFromCustomer({ platformId, customer }: SaveFromCustomerParams): Promise<SelfServeTrialDates | null> {
        const dates = trialDatesOf(customer)
        if (!isNil(dates)) {
            await selfServeTrialUtils.save({ platformId, dates })
            return dates
        }
        return selfServeTrialUtils.rememberNoTrial(platformId)
    },
    async rememberNoTrial(platformId: string): Promise<SelfServeTrialDates | null> {
        const remembered = await distributedStore.putIfAbsent(getSelfServeTrialKey(platformId), { dates: null }, SELF_SERVE_TRIAL_TTL_SECONDS)
        if (remembered) {
            return null
        }
        return (await selfServeTrialUtils.read(platformId))?.dates ?? null
    },
    async forget(platformId: string): Promise<void> {
        await distributedStore.delete(getSelfServeTrialKey(platformId))
    },
}

function trialDatesOf(customer: GetCustomerResponse): SelfServeTrialDates | null {
    const addOn = customer.subscriptions.find((subscription) =>
        subscription.planId === PlanName.ENTERPRISE_TRIAL
        && subscription.status === 'active'
        && !isNil(subscription.trialEndsAt))
    if (!isNil(addOn) && !isNil(addOn.trialEndsAt)) {
        return { startedAt: new Date(addOn.startedAt).toISOString(), endsAt: new Date(addOn.trialEndsAt).toISOString() }
    }
    const metadata: Record<string, unknown> = customer.metadata ?? {}
    const startedAt = Date.parse(String(metadata[METADATA_STARTED_AT] ?? ''))
    const endsAt = Date.parse(String(metadata[METADATA_ENDS_AT] ?? ''))
    if (Number.isNaN(startedAt) || Number.isNaN(endsAt) || endsAt <= startedAt) {
        return null
    }
    return { startedAt: new Date(startedAt).toISOString(), endsAt: new Date(endsAt).toISOString() }
}

const METADATA_STARTED_AT = 'self_serve_trial_started_at'

const METADATA_ENDS_AT = 'self_serve_trial_ends_at'

type SaveSelfServeTrialParams = {
    platformId: string
    dates: SelfServeTrialDates | null
}

type SaveFromCustomerParams = {
    platformId: string
    customer: GetCustomerResponse
}

export type CachedSelfServeTrial = {
    dates: SelfServeTrialDates | null
}
