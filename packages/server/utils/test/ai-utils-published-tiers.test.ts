import { AIProviderName } from '@activepieces/core-utils'
import { aiProviderCredentials } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()

vi.mock('../src/safe-http', () => ({
    safeHttp: {
        get retryingAxios() {
            return { get }
        },
    },
}))

const PUBLISHED_ONLY_MODEL = 'acme/brand-new-model'

const PUBLISHED = {
    version: 1,
    publishedAt: '2026-09-29T00:00:00.000Z',
    publishedBy: 'ops@activepieces.com',
    tiers: [{ id: 'fast', label: 'Fast', modelId: PUBLISHED_ONLY_MODEL, thinkingBudget: 5_000 }],
    defaultTierId: 'fast',
}

describe('aiUtils.createModel on the managed key with a published tier file', () => {
    beforeEach(() => {
        get.mockReset()
        process.env['AP_MODEL_TIERS_URL'] = 'https://tiers.test/pricing.json'
        vi.resetModules()
    })

    it('runs a model only the published tiers permit once the file is loaded', async () => {
        get.mockResolvedValue({ data: PUBLISHED })
        const { modelTierCatalog } = await import('../src/model-tier-catalog')
        const { aiUtils } = await import('../src/ai-utils')
        const managed = aiProviderCredentials({ provider: AIProviderName.ACTIVEPIECES, auth: { apiKey: 'sk-managed' }, config: {} })

        await modelTierCatalog.warmUp()

        expect(() => aiUtils.createModel({ credentials: managed, modelId: PUBLISHED_ONLY_MODEL })).not.toThrow()
    })
})
