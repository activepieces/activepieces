import { AIProviderName } from '@activepieces/core-utils'
import { PersistedChatRole } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockTrackCredits, mockResolveMessages, mockCountBillableToolCalls, mockGetOrCreateForPlatform } = vi.hoisted(() => ({
    mockTrackCredits: vi.fn().mockResolvedValue(undefined),
    mockResolveMessages: vi.fn(),
    mockCountBillableToolCalls: vi.fn().mockReturnValue(0),
    mockGetOrCreateForPlatform: vi.fn(),
}))

vi.mock('../../../../../src/app/helper/telemetry.utils', () => ({
    BillingEvents: { CHAT_MESSAGE: 'chat_message' },
    captureBillingEvent: vi.fn(),
}))

vi.mock('../../../../../src/app/platform/billing-provider', () => ({
    CreditUsageSource: { CHAT: 'chat' },
    trackCreditsWithAppSumo: mockTrackCredits,
}))

vi.mock('../../../../../src/app/ee/platform/platform-plan/platform-plan.service', () => ({
    platformPlanService: () => ({ getOrCreateForPlatform: mockGetOrCreateForPlatform }),
}))

vi.mock('../../../../../src/app/ee/chat/chat-helpers', () => ({
    chatHelpers: {
        resolveChatProviderName: vi.fn().mockResolvedValue(AIProviderName.ACTIVEPIECES),
        resolveModelIdForAnalytics: vi.fn().mockReturnValue('model-x'),
        resolveTier: vi.fn().mockReturnValue({ id: 'tier-1', creditWeight: 5 }),
    },
}))

vi.mock('../../../../../src/app/ee/chat/chat-tool-billing', () => ({
    chatToolBilling: { countBillableToolCallsInLatestTurn: mockCountBillableToolCalls },
}))

vi.mock('../../../../../src/app/ee/chat/history/chat-history', () => ({
    chatHistory: { resolveMessages: mockResolveMessages },
}))

const noopLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }

const conversation = {
    id: 'conv-1',
    platformId: 'plat-1',
    projectId: 'proj-1',
    userId: 'user-1',
    modelName: 'tier-1',
}

async function callTrack({ runId }: { runId?: string }): Promise<void> {
    const { chatUsageTracker } = await import('../../../../../src/app/ee/chat/chat-usage-tracker')
    await chatUsageTracker(noopLogger as never).track({ conversation: conversation as never, runId })
}

function creditsKeyFromLastCall(): string {
    return mockTrackCredits.mock.calls[0][0].credits.idempotencyKey
}

function appSumoKeyFromLastCall(): string | undefined {
    return mockTrackCredits.mock.calls[0][0].appSumo?.idempotencyKey
}

describe('chatUsageTracker.track — idempotency key scoping', () => {
    beforeEach(() => {
        mockTrackCredits.mockClear()
        mockGetOrCreateForPlatform.mockResolvedValue({ plan: 'plus', licenseKey: null })
        mockResolveMessages.mockReturnValue([
            { role: PersistedChatRole.USER },
            { role: PersistedChatRole.ASSISTANT },
            { role: PersistedChatRole.USER },
            { role: PersistedChatRole.ASSISTANT },
        ])
    })

    it('scopes the key to the owning run so two overlapping runs cannot collide', async () => {
        await callTrack({ runId: 'run-9' })

        expect(creditsKeyFromLastCall()).toBe('conv-1:chat:run-9')
    })

    it('falls back to the turn index when no run id is supplied', async () => {
        await callTrack({ runId: undefined })

        expect(creditsKeyFromLastCall()).toBe('conv-1:chat:2')
    })

    it('a run-scoped key never equals the turn-index key it replaces', async () => {
        await callTrack({ runId: 'run-9' })
        const runScoped = creditsKeyFromLastCall()
        mockTrackCredits.mockClear()
        await callTrack({ runId: undefined })

        expect(runScoped).not.toBe(creditsKeyFromLastCall())
    })

    it('scopes the AppSumo hard-cap key the same way', async () => {
        mockGetOrCreateForPlatform.mockResolvedValue({ plan: 'appsumo_activepieces_tier2', licenseKey: null })

        await callTrack({ runId: 'run-9' })

        expect(appSumoKeyFromLastCall()).toBe('conv-1:appSumoAi:run-9')
    })
})
