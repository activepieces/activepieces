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

    it('lets the turn continue when the check itself fails, instead of reporting the platform as out of credits', async () => {
        mockCreditsState.mockRejectedValue(new Error('redis down'))

        expect(await check()).toBe(true)
    })
})

function check(): Promise<boolean> {
    return conversationRpc(log).agentHasCredits({ platformId: 'platform-1', conversationId: 'conv-1' })
}

function creditsState({ blocked }: { blocked: boolean }): Awaited<ReturnType<typeof noopProvider.getCreditsAndAppSumoState>> {
    const state = { blocked, usage: 100, limit: 100, remaining: blocked ? 0 : 50, unlimited: false }
    return { credits: state, appSumo: { ...state, blocked: false } }
}
