import { beforeEach, describe, expect, it, vi } from 'vitest'
import { conversationRpc } from '../../../../../src/app/ee/agent/rpc/conversation-rpc'
import { billingProvider } from '../../../../../src/app/platform/billing-provider'

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } as never
const noopProvider = billingProvider.get(log)
const mockCreditsState = vi.fn()

describe('agentHasCredits', () => {
    beforeEach(() => {
        mockCreditsState.mockReset()
        billingProvider.set(() => ({ ...noopProvider, getCreditsAndAppSumoState: mockCreditsState }))
    })

    it('says yes while the platform has credits', async () => {
        mockCreditsState.mockResolvedValue(creditsState({ blocked: false }))

        expect(await check()).toBe(true)
        expect(mockCreditsState).toHaveBeenCalledWith('platform-1')
    })

    it('says no once the platform is out of credits', async () => {
        mockCreditsState.mockResolvedValue(creditsState({ blocked: true }))

        expect(await check()).toBe(false)
    })

    it('says no once the credits left would not cover what the turn has already used', async () => {
        mockCreditsState.mockResolvedValue(creditsState({ blocked: false, remaining: 3 }))

        expect(await check({ pendingCredits: 3 })).toBe(true)
        expect(await check({ pendingCredits: 4 })).toBe(false)
    })

    it('ignores pending credits on a platform that is not metered', async () => {
        mockCreditsState.mockResolvedValue(creditsState({ blocked: false, remaining: 0, metered: false }))

        expect(await check({ pendingCredits: 5 })).toBe(true)
    })

    it('lets the turn continue when the check itself fails, instead of reporting the platform as out of credits', async () => {
        mockCreditsState.mockRejectedValue(new Error('redis down'))

        expect(await check()).toBe(true)
    })
})

function check({ pendingCredits = 0 }: { pendingCredits?: number } = {}): Promise<boolean> {
    return conversationRpc(log).agentHasCredits({ platformId: 'platform-1', conversationId: 'conv-1', pendingCredits })
}

function creditsState({ blocked, remaining = blocked ? 0 : 50, metered = true }: { blocked: boolean, remaining?: number, metered?: boolean }): Awaited<ReturnType<typeof noopProvider.getCreditsAndAppSumoState>> {
    return {
        credits: { blocked, metered, usage: 100, limit: 100, remaining, unlimited: false },
        appSumo: { blocked: false, metered: false, usage: 0, limit: 0, remaining: 0, unlimited: false },
    }
}
