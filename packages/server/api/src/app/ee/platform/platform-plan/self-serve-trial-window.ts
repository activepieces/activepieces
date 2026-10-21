import { isNil } from '@activepieces/core-utils'
import { PlanName, SelfServeTrialWindow } from '@activepieces/shared'
import { type GetCustomerResponse } from 'autumn-js'
import { getSelfServeTrialWindowKey, SELF_SERVE_TRIAL_WINDOW_TTL_SECONDS } from '../../../database/redis/keys'
import { distributedStore } from '../../../database/redis-connections'

export const selfServeTrialWindow = {
    async read(platformId: string): Promise<CachedSelfServeTrialWindow | null> {
        return distributedStore.get<CachedSelfServeTrialWindow>(getSelfServeTrialWindowKey(platformId))
    },
    async save({ platformId, window }: SaveSelfServeTrialWindowParams): Promise<void> {
        await distributedStore.put(getSelfServeTrialWindowKey(platformId), { window }, SELF_SERVE_TRIAL_WINDOW_TTL_SECONDS)
    },
    async saveFromCustomer({ platformId, customer }: SaveFromCustomerParams): Promise<SelfServeTrialWindow | null> {
        const window = windowOf(customer)
        if (!isNil(window)) {
            await selfServeTrialWindow.save({ platformId, window })
            return window
        }
        const cached = await selfServeTrialWindow.read(platformId)
        if (!isNil(cached?.window)) {
            return cached.window
        }
        await selfServeTrialWindow.save({ platformId, window: null })
        return null
    },
    async forget(platformId: string): Promise<void> {
        await distributedStore.delete(getSelfServeTrialWindowKey(platformId))
    },
}

function windowOf(customer: GetCustomerResponse): SelfServeTrialWindow | null {
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

type SaveSelfServeTrialWindowParams = {
    platformId: string
    window: SelfServeTrialWindow | null
}

type SaveFromCustomerParams = {
    platformId: string
    customer: GetCustomerResponse
}

export type CachedSelfServeTrialWindow = {
    window: SelfServeTrialWindow | null
}
