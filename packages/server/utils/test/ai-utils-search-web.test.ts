import { AIProviderName } from '@activepieces/core-utils'
import { aiProviderCredentials } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { aiUtils } from '../src/ai-utils'

const { mockGenerateText } = vi.hoisted(() => ({ mockGenerateText: vi.fn() }))

vi.mock('ai', async (importOriginal) => ({
    ...(await importOriginal<typeof import('ai')>()),
    generateText: mockGenerateText,
}))

describe('aiUtils.searchWeb', () => {
    beforeEach(() => {
        mockGenerateText.mockReset()
        mockGenerateText.mockResolvedValue({
            text: 'Pricing starts free.',
            sources: [
                { type: 'source', sourceType: 'url', id: 's1', url: 'https://www.activepieces.com/pricing', title: 'Pricing' },
                { type: 'source', sourceType: 'url', id: 's2', url: 'https://www.activepieces.com/pricing', title: 'Pricing' },
                { type: 'source', sourceType: 'document', id: 's3', mediaType: 'application/pdf', title: 'Deck' },
                { type: 'source', sourceType: 'url', id: 's4', url: 'https://docs.activepieces.com' },
            ],
        })
    })

    it('returns the answer with each source page once', async () => {
        const result = await searchAnthropic()

        expect(result).toEqual({
            text: 'Pricing starts free.',
            sources: [
                { url: 'https://www.activepieces.com/pricing', title: 'Pricing' },
                { url: 'https://docs.activepieces.com', title: '' },
            ],
        })
    })

    it('gives the model the provider\'s own search tool', async () => {
        await searchAnthropic()

        expect(Object.keys(mockGenerateText.mock.calls[0][0].tools ?? {})).toEqual(['web_search'])
    })
})

function searchAnthropic(): ReturnType<typeof aiUtils.searchWeb> {
    return aiUtils.searchWeb({
        credentials: aiProviderCredentials({ provider: AIProviderName.ANTHROPIC, auth: { apiKey: 'key' }, config: {} }),
        modelId: 'claude-haiku-4-5',
        system: 'Search.',
        prompt: 'activepieces pricing',
        abortSignal: new AbortController().signal,
    })
}
