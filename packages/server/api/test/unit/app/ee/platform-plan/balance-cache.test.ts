import { ConsumableFeatureId } from '@activepieces/shared'
import { type GetCustomerResponse } from 'autumn-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { autumnUtils } from '../../../../../src/app/ee/platform/platform-plan/billing-providers/autumn-utils'

const { store } = vi.hoisted(() => ({ store: new Map<string, unknown>() }))

vi.mock('../../../../../src/app/database/redis-connections', () => ({
    distributedStore: {
        get: async (key: string) => store.get(key) ?? null,
        put: async (key: string, value: unknown) => {
            store.set(key, value)
        },
        delete: async (keys: string | string[]) => {
            for (const key of [keys].flat()) {
                store.delete(key)
            }
        },
    },
}))

vi.mock('../../../../../src/app/ee/platform/platform-plan/platform-plan.service', () => ({
    platformPlanService: () => ({}),
    platformPlanRepo: () => ({}),
}))

vi.mock('../../../../../src/app/ee/platform/platform-plan/platform-plan-telemetry', () => ({
    platformPlanTelemetry: () => ({}),
}))

vi.mock('../../../../../src/app/platform/platform.service', () => ({
    platformService: () => ({}),
}))

vi.mock('../../../../../src/app/user/user-service', () => ({
    userService: () => ({}),
}))

const PLATFORM_ID = 'platform-1'

function exhausted(): Balance {
    return { granted: 100, usage: 100, remaining: 0, unlimited: false, nextResetAt: null, breakdown: [] }
}

function customerWith(balances: Partial<Record<ConsumableFeatureId, Balance>>): GetCustomerResponse {
    return { balances } as unknown as GetCustomerResponse
}

async function refresh(balances: Partial<Record<ConsumableFeatureId, Balance>>): Promise<void> {
    await autumnUtils.writeCustomerStateCaches({ platformId: PLATFORM_ID, customer: customerWith(balances), grantedFeatureIds: new Set() })
}

function readBalance(featureId: ConsumableFeatureId) {
    return autumnUtils.readBalance({ platformId: PLATFORM_ID, featureId })
}

describe('writeCustomerStateCaches balance cache', () => {
    beforeEach(() => {
        store.clear()
    })

    it.each([ConsumableFeatureId.APP_SUMO_AI_CREDITS, ConsumableFeatureId.AP_CREDITS])('clears the cached %s balance when the refreshed customer no longer has the feature', async (featureId) => {
        await refresh({ [featureId]: exhausted() })
        expect((await readBalance(featureId))?.remaining).toBe(0)

        await refresh({})

        expect(await readBalance(featureId)).toBeNull()

        await refresh({ [featureId]: exhausted() })

        expect((await readBalance(featureId))?.remaining).toBe(0)
    })

    it.each([ConsumableFeatureId.APP_SUMO_AI_CREDITS, ConsumableFeatureId.AP_CREDITS])('overwrites the cached %s balance when the refreshed customer still has the feature', async (featureId) => {
        await refresh({ [featureId]: exhausted() })

        await refresh({ [featureId]: { ...exhausted(), granted: 500, remaining: 400, usage: 100 } })

        expect((await readBalance(featureId))?.remaining).toBe(400)
    })
})

type Balance = GetCustomerResponse['balances'][string]
