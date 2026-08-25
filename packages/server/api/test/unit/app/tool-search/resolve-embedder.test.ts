import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetConfigOrThrow = vi.fn()

vi.mock('../../../../src/app/ai/ai-provider-service', () => ({
    aiProviderService: vi.fn(() => ({
        getConfigOrThrow: mockGetConfigOrThrow,
    })),
}))

import { system } from '../../../../src/app/helper/system/system'
import { AppSystemProp } from '../../../../src/app/helper/system/system-props'
import { OPENAI_3_SMALL_MODEL_VERSION } from '../../../../src/app/tool-search/embedder'
import { resolveEmbedder } from '../../../../src/app/tool-search/resolve-embedder'

const log = system.globalLogger()

describe('resolveEmbedder', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Default to no env key so the existing cases exercise the platform (DB) path.
        vi.spyOn(system, 'get').mockReturnValue(undefined)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('prefers the AP_OPENAI_API_KEY env var and skips the platform lookup', async () => {
        vi.mocked(system.get).mockImplementation((prop) =>
            (prop === AppSystemProp.OPENAI_API_KEY ? 'sk-env-key' : undefined),
        )

        const embedder = await resolveEmbedder({ platformId: 'plat-1', log })

        expect(embedder).not.toBeNull()
        expect(embedder?.modelVersion).toBe(OPENAI_3_SMALL_MODEL_VERSION)
        expect(mockGetConfigOrThrow).not.toHaveBeenCalled()
    })

    it('falls back to the platform key when AP_OPENAI_API_KEY is an empty string', async () => {
        vi.mocked(system.get).mockImplementation((prop) =>
            (prop === AppSystemProp.OPENAI_API_KEY ? '' : undefined),
        )
        mockGetConfigOrThrow.mockResolvedValue({ auth: { apiKey: 'sk-platform-key' } })

        const embedder = await resolveEmbedder({ platformId: 'plat-1', log })

        expect(embedder).not.toBeNull()
        expect(mockGetConfigOrThrow).toHaveBeenCalledTimes(1)
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
