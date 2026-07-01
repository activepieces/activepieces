import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetConfigOrThrow = vi.fn()

vi.mock('../../../../src/app/ai/ai-provider-service', () => ({
    aiProviderService: vi.fn(() => ({
        getConfigOrThrow: mockGetConfigOrThrow,
    })),
}))

import { system } from '../../../../src/app/helper/system/system'
import { OPENAI_3_SMALL_MODEL_VERSION } from '../../../../src/app/tool-search/embedder'
import { resolveEmbedder } from '../../../../src/app/tool-search/resolve-embedder'

const log = system.globalLogger()

describe('resolveEmbedder', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns the OpenAI embedder when the platform has an OpenAI key', async () => {
        mockGetConfigOrThrow.mockResolvedValue({ auth: { apiKey: 'sk-test-key' } })

        const embedder = await resolveEmbedder({ platformId: 'plat-1', log })

        expect(embedder).not.toBeNull()
        expect(embedder?.modelVersion).toBe(OPENAI_3_SMALL_MODEL_VERSION)
    })

    it('returns null when no OpenAI provider is configured (getConfigOrThrow throws)', async () => {
        mockGetConfigOrThrow.mockRejectedValue(new Error('AIProvider not found'))

        const embedder = await resolveEmbedder({ platformId: 'plat-1', log })

        expect(embedder).toBeNull()
    })

    it('returns null when the provider config carries no api key', async () => {
        mockGetConfigOrThrow.mockResolvedValue({ auth: { apiKey: '' } })

        const embedder = await resolveEmbedder({ platformId: 'plat-1', log })

        expect(embedder).toBeNull()
    })
})
