import { DEFAULT_MANAGED_MODEL_WEIGHT, MANAGED_MODEL_WEIGHTS } from '@activepieces/shared'

const PRICING_URL = 'https://pricing.test/pricing.json'

const validPricing = {
    version: 7,
    publishedAt: '2026-08-31T10:00:00.000Z',
    publishedBy: 'marketing@activepieces.com',
    tiers: [
        { id: 'fast', label: 'Fast', modelId: 'anthropic/claude-haiku-4.5', thinkingBudget: 5_000, creditWeight: 11 },
        { id: 'smart', label: 'Expert', modelId: 'anthropic/claude-sonnet-4.6', thinkingBudget: 10_000, creditWeight: 44 },
    ],
    defaultTierId: 'smart',
    modelWeights: { ...MANAGED_MODEL_WEIGHTS, 'openai/gpt-4': 999 },
    unpricedModelCreditWeight: 250,
}

async function loadCatalog(): Promise<typeof import('../src/ai-pricing-catalog')['aiPricingCatalog']> {
    vi.resetModules()
    const mod = await import('../src/ai-pricing-catalog')
    return mod.aiPricingCatalog
}

function mockResponse(data: unknown): void {
    vi.doMock('../src/safe-http', () => ({
        safeHttp: { retryingAxios: { get: vi.fn().mockResolvedValue({ data }) } },
    }))
}

function mockFailure(): void {
    vi.doMock('../src/safe-http', () => ({
        safeHttp: { retryingAxios: { get: vi.fn().mockRejectedValue(new Error('network is down')) } },
    }))
}

beforeEach(() => {
    process.env['AP_AI_PRICING_URL'] = PRICING_URL
})

afterEach(() => {
    delete process.env['AP_AI_PRICING_URL']
    vi.doUnmock('../src/safe-http')
})

describe('aiPricingCatalog', () => {
    it('uses the published prices when the file is valid', async () => {
        mockResponse(validPricing)
        const reader = await (await loadCatalog()).load()

        expect(reader.defaultTierId).toBe('smart')
        expect(reader.creditWeightForModel('anthropic/claude-haiku-4.5')).toBe(11)
        expect(reader.creditWeightForModel('openai/gpt-4')).toBe(999)
        expect(reader.creditWeightForModel('some/model-we-never-priced')).toBe(250)
    })

    it('falls back to the values shipped with the release when the fetch fails', async () => {
        mockFailure()
        const reader = await (await loadCatalog()).load()

        expect(reader.defaultTierId).toBe('smart')
        expect(reader.creditWeightForModel('openai/gpt-4')).toBe(MANAGED_MODEL_WEIGHTS['openai/gpt-4'])
        expect(reader.creditWeightForModel('some/model-we-never-priced')).toBe(DEFAULT_MANAGED_MODEL_WEIGHT)
    })

    it('rejects a file whose default tier does not exist', async () => {
        mockResponse({ ...validPricing, defaultTierId: 'nope' })
        const reader = await (await loadCatalog()).load()
        expect(reader.creditWeightForModel('openai/gpt-4')).toBe(MANAGED_MODEL_WEIGHTS['openai/gpt-4'])
    })

    it('rejects a file with no tiers', async () => {
        mockResponse({ ...validPricing, tiers: [] })
        const reader = await (await loadCatalog()).load()
        expect(reader.creditWeightForModel('openai/gpt-4')).toBe(MANAGED_MODEL_WEIGHTS['openai/gpt-4'])
    })

    it('keeps the shipped weight for a model the published file leaves out, so a short file cannot overcharge', async () => {
        mockResponse({ ...validPricing, modelWeights: { 'openai/gpt-4': 999 } })
        const reader = await (await loadCatalog()).load()

        expect(reader.creditWeightForModel('openai/gpt-4')).toBe(999)
        expect(reader.creditWeightForModel('google/gemini-2.5-flash-lite')).toBe(MANAGED_MODEL_WEIGHTS['google/gemini-2.5-flash-lite'])
        expect(reader.creditWeightForModel('some/model-we-never-priced')).toBe(validPricing.unpricedModelCreditWeight)
    })

    it('rejects a weight outside the allowed range', async () => {
        mockResponse({ ...validPricing, unpricedModelCreditWeight: 0 })
        const reader = await (await loadCatalog()).load()
        expect(reader.creditWeightForModel('some/model-we-never-priced')).toBe(DEFAULT_MANAGED_MODEL_WEIGHT)
    })

    it('resolves an unknown tier id to the default tier', async () => {
        mockResponse(validPricing)
        const reader = await (await loadCatalog()).load()
        expect(reader.resolveTier('does-not-exist').id).toBe('smart')
        expect(reader.resolveTier(undefined).id).toBe('smart')
        expect(reader.resolveTier('fast').id).toBe('fast')
    })

    it('prices an unknown model above every bundled tier, so a forgotten model is never cheap', () => {
        expect(DEFAULT_MANAGED_MODEL_WEIGHT).toBeGreaterThan(80)
    })
})
