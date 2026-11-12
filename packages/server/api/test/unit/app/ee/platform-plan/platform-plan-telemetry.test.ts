import { beforeEach, describe, expect, it, vi } from 'vitest'

const { store, mockTrackPlatform } = vi.hoisted(() => ({
    store: new Map<string, unknown>(),
    mockTrackPlatform: vi.fn(),
}))

vi.mock('../../../../../src/app/database/redis-connections', () => ({
    distributedStore: {
        delete: async (key: string) => {
            store.delete(key)
        },
        runOnceWithin: async (key: string, _ttl: number, fn: () => Promise<unknown>) => {
            if (store.has(key)) {
                return false
            }
            store.set(key, '1')
            await fn()
            return true
        },
    },
}))

vi.mock('../../../../../src/app/helper/telemetry.utils', () => ({
    telemetry: () => ({ trackPlatform: mockTrackPlatform }),
}))

vi.mock('../../../../../src/app/platform/platform.service', () => ({
    platformService: () => ({}),
}))

vi.mock('../../../../../src/app/ee/platform/platform-plan/platform-plan.service', () => ({
    platformPlanRepo: () => ({}),
}))

const ENDED = { platformId: 'platform-1', trialEndsAt: '2026-10-08T09:00:00.000Z', endedAt: '2026-10-08T09:00:00.000Z' }
const log = { warn: vi.fn(), error: vi.fn(), info: vi.fn() } as never

async function trialTelemetry() {
    const { platformPlanTelemetry } = await import('../../../../../src/app/ee/platform/platform-plan/platform-plan-telemetry')
    return platformPlanTelemetry(log)
}

describe('trial.ended telemetry', () => {
    beforeEach(() => {
        store.clear()
        mockTrackPlatform.mockReset()
    })

    it('sends the event once per trial end', async () => {
        mockTrackPlatform.mockResolvedValue(undefined)
        const telemetry = await trialTelemetry()

        await telemetry.onSelfServeTrialEnded(ENDED)
        await telemetry.onSelfServeTrialEnded(ENDED)

        expect(mockTrackPlatform).toHaveBeenCalledTimes(1)
    })

    it('sends it again on the next refresh when sending failed', async () => {
        mockTrackPlatform.mockRejectedValueOnce(new Error('database unavailable')).mockResolvedValue(undefined)
        const telemetry = await trialTelemetry()

        await expect(telemetry.onSelfServeTrialEnded(ENDED)).rejects.toThrow('database unavailable')
        await telemetry.onSelfServeTrialEnded(ENDED)
        await telemetry.onSelfServeTrialEnded(ENDED)

        expect(mockTrackPlatform).toHaveBeenCalledTimes(2)
    })
})
