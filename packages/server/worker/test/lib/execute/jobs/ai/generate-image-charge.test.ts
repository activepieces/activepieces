import { ActivepiecesAiConsumerSource, AIProviderName } from '@activepieces/core-utils'
import { AiProviderCredentials, aiProviderCredentials } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { reportFixedCredits, reportUsageOnly } = vi.hoisted(() => ({ reportFixedCredits: vi.fn(), reportUsageOnly: vi.fn() }))

vi.mock('@activepieces/server-utils', async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    aiUtils: { createModelForImages: () => ({ modelId: 'gpt-image-1.5' }) },
    activepiecesAiCost: { ...(await importOriginal<{ activepiecesAiCost: Record<string, unknown> }>()).activepiecesAiCost, reportFixedCredits, reportUsageOnly },
}))

vi.mock('ai', async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    generateImage: async () => ({ image: { base64: Buffer.from('png').toString('base64'), uint8Array: new Uint8Array(), mediaType: 'image/png' }, responses: [{ headers: { 'x-litellm-response-cost': '0.04' } }] }),
}))

const { getGeneratedImage } = await import('../../../../../src/lib/execute/jobs/ai/generate-image')

describe('getGeneratedImage charging', () => {
    beforeEach(() => {
        reportFixedCredits.mockReset()
        reportUsageOnly.mockReset()
    })

    it('charges a fixed credit for a flow step on an own key', async () => {
        await generate({ turnAlreadyCharged: false })

        expect(reportFixedCredits).toHaveBeenCalledTimes(1)
    })

    it('adds no fixed credit when the chat turn already charged for the call, but still records the image for usage', async () => {
        await generate({ turnAlreadyCharged: true })

        expect(reportFixedCredits).not.toHaveBeenCalled()
        expect(reportUsageOnly).toHaveBeenCalledTimes(1)
    })

    it('records the image cost a LiteLLM proxy sends back', async () => {
        await generate({ turnAlreadyCharged: false, credentials: LITELLM_CREDENTIALS })

        expect(reportFixedCredits).toHaveBeenCalledWith(expect.objectContaining({ provider: AIProviderName.LITELLM, observedCostUsd: 0.04 }))
    })

    it('ignores that header from a provider that is not a LiteLLM-style gateway', async () => {
        await generate({ turnAlreadyCharged: false })

        expect(reportFixedCredits.mock.calls[0][0]).not.toHaveProperty('observedCostUsd')
    })
})

function generate({ turnAlreadyCharged, credentials = aiProviderCredentials({ provider: AIProviderName.OPENAI, auth: { apiKey: 'key' }, config: {} }) }: { turnAlreadyCharged: boolean, credentials?: AiProviderCredentials }): ReturnType<typeof getGeneratedImage> {
    return getGeneratedImage({
        credentials,
        modelId: 'gpt-image-1.5',
        prompt: 'a banner',
        inputImages: [],
        billing: { source: ActivepiecesAiConsumerSource.CHAT, platformId: 'platform-1', projectId: null, conversationId: 'conversation-1', chat: { userId: 'user-1', turnIndex: 0, tier: 'fast' } },
        turnAlreadyCharged,
    })
}

const LITELLM_CREDENTIALS = aiProviderCredentials({ provider: AIProviderName.LITELLM, auth: { apiKey: 'sk-proxy' }, config: { baseUrl: 'https://litellm.example.com/v1', apiKeyHeader: 'Authorization', models: [] } })
