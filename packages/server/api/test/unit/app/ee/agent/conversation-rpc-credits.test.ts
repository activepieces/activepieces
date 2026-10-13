import { beforeEach, describe, expect, it, vi } from 'vitest'
import { conversationRpc } from '../../../../../src/app/ee/agent/rpc/conversation-rpc'
import { billingProvider } from '../../../../../src/app/platform/billing-provider'

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } as never
const noopProvider = billingProvider.get(log)
const mockCreditsState = vi.fn()

describe('agentCreditsLeft', () => {
    beforeEach(() => {
        mockCreditsState.mockReset()
        billingProvider.set(() => ({ ...noopProvider, getCreditsAndAppSumoState: mockCreditsState }))
    })

    it('reports the credits left after what the turn has already used', async () => {
        mockCreditsState.mockResolvedValue(creditsState({ remaining: 3 }))

        expect(await check({ pendingCredits: 2 })).toBe(1)
        expect(await check({ pendingCredits: 3 })).toBe(0)
        expect(await check({ pendingCredits: 4 })).toBe(-1)
        expect(mockCreditsState).toHaveBeenCalledWith('platform-1')
    })

    it('reports no limit on a platform that is not metered', async () => {
        mockCreditsState.mockResolvedValue(creditsState({ remaining: 0, metered: false }))

        expect(await check({ pendingCredits: 5 })).toBeNull()
    })

    it('reports no limit when the check itself fails, so the turn is not stopped by an outage', async () => {
        mockCreditsState.mockRejectedValue(new Error('redis down'))

        expect(await check({ pendingCredits: 1 })).toBeNull()
    })
})

function check({ pendingCredits }: { pendingCredits: number }): Promise<number | null> {
    return conversationRpc(log).agentCreditsLeft({ platformId: 'platform-1', conversationId: 'conv-1', pendingCredits })
}

function creditsState({ remaining, metered = true }: { remaining: number, metered?: boolean }): Awaited<ReturnType<typeof noopProvider.getCreditsAndAppSumoState>> {
    return {
        credits: { blocked: metered && remaining <= 0, metered, usage: 100, limit: 100, remaining, unlimited: false },
        appSumo: { blocked: false, metered: false, usage: 0, limit: 0, remaining: 0, unlimited: false },
    }
}
