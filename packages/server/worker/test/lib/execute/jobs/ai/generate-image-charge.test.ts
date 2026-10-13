import { ActivepiecesAiConsumerSource, AIProviderName } from '@activepieces/core-utils'
import { aiProviderCredentials } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { reportFixedCredits } = vi.hoisted(() => ({ reportFixedCredits: vi.fn() }))

vi.mock('@activepieces/server-utils', async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    aiUtils: { createModelForImages: () => ({ modelId: 'gpt-image-1.5' }) },
    activepiecesAiCost: { reportFixedCredits },
}))

vi.mock('ai', async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    generateImage: async () => ({ image: { base64: Buffer.from('png').toString('base64'), uint8Array: new Uint8Array(), mediaType: 'image/png' } }),
}))

const { getGeneratedImage } = await import('../../../../../src/lib/execute/jobs/ai/generate-image')

describe('getGeneratedImage charging', () => {
    beforeEach(() => {
        reportFixedCredits.mockReset()
    })

    it('charges a fixed credit for a flow step on an own key', async () => {
        await generate({ turnAlreadyCharged: false })

        expect(reportFixedCredits).toHaveBeenCalledTimes(1)
    })

    it('adds no fixed credit when the chat turn already charged for the call', async () => {
        await generate({ turnAlreadyCharged: true })

        expect(reportFixedCredits).not.toHaveBeenCalled()
    })
})

function generate({ turnAlreadyCharged }: { turnAlreadyCharged: boolean }): ReturnType<typeof getGeneratedImage> {
    return getGeneratedImage({
        credentials: aiProviderCredentials({ provider: AIProviderName.OPENAI, auth: { apiKey: 'key' }, config: {} }),
        modelId: 'gpt-image-1.5',
        prompt: 'a banner',
        inputImages: [],
        billing: { source: ActivepiecesAiConsumerSource.CHAT, platformId: 'platform-1', projectId: null, conversationId: 'conversation-1', chat: { userId: 'user-1', turnIndex: 0, tier: 'fast' } },
        turnAlreadyCharged,
    })
}
