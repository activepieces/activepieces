import { Balance } from 'autumn-js'
import { getCreditsBalanceKey } from '../../../../database/redis/keys'
import { distributedStore } from '../../../../database/redis-connections'

const CREDITS_CACHE_TTL_SECONDS = 180

export async function writeCreditsBalance(platformId: string, balance: Balance): Promise<void> {
    const cached: CreditsBalanceCache = {
        granted: balance.granted,
        usage: balance.usage,
        remaining: balance.remaining,
        unlimited: balance.unlimited,
        nextResetAt: balance.nextResetAt,
        syncedAt: Date.now(),
    }
    await distributedStore.put(getCreditsBalanceKey(platformId), cached, CREDITS_CACHE_TTL_SECONDS)
}

export async function readCreditsBalance(platformId: string): Promise<CreditsBalanceCache | null> {
    return distributedStore.get<CreditsBalanceCache>(getCreditsBalanceKey(platformId))
}

export type CreditsBalanceCache = {
    granted: number
    usage: number
    remaining: number
    unlimited: boolean
    nextResetAt: number | null
    syncedAt: number
}
