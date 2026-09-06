import { AIProviderName } from '@activepieces/core-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGenerateText, mockTrackBilling, mockGetOrCreateForPlatform, mockResolveTierModel } = vi.hoisted(() => ({
    mockGenerateText: vi.fn(),
    mockTrackBilling: vi.fn().mockResolvedValue(undefined),
    mockGetOrCreateForPlatform: vi.fn().mockResolvedValue({ plan: 'free', licenseKey: null }),
    mockResolveTierModel: vi.fn().mockResolvedValue({ model: {}, modelId: 'fast-model', provider: 'activepieces' }),
}))

vi.mock('ai', async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    generateText: mockGenerateText,
}))

vi.mock('../../../../../src/app/platform/billing-and-telemetry', () => ({
    trackBillingAndSendTelemetry: mockTrackBilling,
}))

vi.mock('../../../../../src/app/platform/billing-provider', () => ({
    CreditUsageSource: { AGENT_DRAFT: 'agent_draft' },
}))

vi.mock('../../../../../src/app/ee/platform/platform-plan/platform-plan.service', () => ({
    platformPlanService: () => ({ getOrCreateForPlatform: mockGetOrCreateForPlatform }),
}))

vi.mock('../../../../../src/app/app-connection/app-connection-service/app-connection-service', () => ({
    appConnectionService: () => ({ listConnectedPieces: vi.fn().mockResolvedValue([]) }),
}))

vi.mock('../../../../../src/app/pieces/metadata/piece-metadata-service', () => ({
    pieceMetadataService: () => ({ get: vi.fn().mockResolvedValue(null) }),
}))

vi.mock('../../../../../src/app/ee/agent/agent-helpers', () => ({
    agentHelpers: {
        resolveTierModel: mockResolveTierModel,
        runScopeOrThrow: ({ projectId }: { projectId: string }) => ({ type: 'project', projectId }),
        resolveChatProviderName: vi.fn().mockResolvedValue(AIProviderName.ACTIVEPIECES),
        resolveTier: vi.fn().mockReturnValue({ id: 'fast', creditWeight: 3 }),
        resolveModelIdForProvider: vi.fn().mockReturnValue('model-x'),
    },
}))

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }

async function draft() {
    const { agentDraftAi } = await import('../../../../../src/app/ee/agent/agent-draft-ai')
    return agentDraftAi(log as never).draft({ platformId: 'plat-1', projectId: 'proj-1', prompt: 'watch the deploys' })
}

const A_VALID_DRAFT = JSON.stringify({
    displayName: 'Deploy watcher',
    description: 'Watches deploys',
    icon: 'bot',
    color: 'PURPLE',
    instructions: 'Watch the deploys and report failures.',
    tools: [],
})

describe('drafting an agent charges for the model call the provider actually ran', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetOrCreateForPlatform.mockResolvedValue({ plan: 'free', licenseKey: null })
        mockResolveTierModel.mockResolvedValue({ model: {}, modelId: 'fast-model', provider: 'activepieces' })
    })

    it('charges for a draft it could use', async () => {
        mockGenerateText.mockResolvedValue({ text: A_VALID_DRAFT })

        await draft()

        expect(mockTrackBilling).toHaveBeenCalledTimes(1)
    })

    it('charges when the model replied with something that is not a draft', async () => {
        mockGenerateText.mockResolvedValue({ text: 'I would love to help you build an agent!' })

        await expect(draft()).rejects.toThrow()

        expect(mockTrackBilling).toHaveBeenCalledTimes(1)
    })

    it('charges nothing when the model call itself failed, since nothing was served', async () => {
        mockGenerateText.mockRejectedValue(new Error('provider is down'))

        await expect(draft()).rejects.toThrow()

        expect(mockTrackBilling).not.toHaveBeenCalled()
    })

    it('charges nothing when no provider could be resolved at all', async () => {
        mockResolveTierModel.mockRejectedValue(new Error('no provider'))

        await expect(draft()).rejects.toThrow()

        expect(mockGenerateText).not.toHaveBeenCalled()
        expect(mockTrackBilling).not.toHaveBeenCalled()
    })
})
