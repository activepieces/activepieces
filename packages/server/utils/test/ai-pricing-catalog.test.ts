import { ACTIVEPIECES_CHAT_TIERS, DEFAULT_CHAT_TIER_ID } from '@activepieces/shared'

const PRICING_URL = 'https://pricing.test/pricing.json'

const validPricing = {
    version: 7,
    publishedAt: '2026-08-31T10:00:00.000Z',
    publishedBy: 'marketing@activepieces.com',
    tiers: [
        { id: 'fast', label: 'Fast', modelId: 'anthropic/claude-haiku-4.5', thinkingBudget: 5_000 },
        { id: 'smart', label: 'Expert', modelId: 'anthropic/claude-sonnet-4.6', thinkingBudget: 10_000 },
    ],
    defaultTierId: 'smart',
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
    it('uses the published tiers when the file is valid', async () => {
        mockResponse(validPricing)
        const reader = await (await loadCatalog()).load()

        expect(reader.defaultTierId).toBe('smart')
        expect(reader.tiers.map((tier) => tier.id)).toEqual(['fast', 'smart'])
        expect(reader.findTierById('fast')?.modelId).toBe('anthropic/claude-haiku-4.5')
        expect(reader.findTierByModelId('anthropic/claude-sonnet-4.6')?.id).toBe('smart')
    })

    it('falls back to the tiers shipped with the release when the fetch fails', async () => {
        mockFailure()
        const reader = await (await loadCatalog()).load()

        expect(reader.defaultTierId).toBe(DEFAULT_CHAT_TIER_ID)
        expect(reader.tiers.map((tier) => tier.id)).toEqual(ACTIVEPIECES_CHAT_TIERS.map((tier) => tier.id))
    })

    it('rejects a file whose default tier does not exist', async () => {
        mockResponse({ ...validPricing, defaultTierId: 'nope' })
        const reader = await (await loadCatalog()).load()
        expect(reader.tiers.map((tier) => tier.id)).toEqual(ACTIVEPIECES_CHAT_TIERS.map((tier) => tier.id))
    })

    it('rejects a file with no tiers', async () => {
        mockResponse({ ...validPricing, tiers: [] })
        const reader = await (await loadCatalog()).load()
        expect(reader.tiers.map((tier) => tier.id)).toEqual(ACTIVEPIECES_CHAT_TIERS.map((tier) => tier.id))
    })

    it('ignores the credit fields an older console still publishes', async () => {
        mockResponse({ ...validPricing, modelWeights: { 'openai/gpt-4': 999 }, unpricedModelCreditWeight: 250 })
        const reader = await (await loadCatalog()).load()

        expect(reader.findTierById('fast')?.modelId).toBe('anthropic/claude-haiku-4.5')
        expect(Object.keys(reader.tiers[0])).not.toContain('creditWeight')
    })

    it('resolves an unknown tier id to the default tier', async () => {
        mockResponse(validPricing)
        const reader = await (await loadCatalog()).load()
        expect(reader.resolveTier('does-not-exist').id).toBe('smart')
        expect(reader.resolveTier(undefined).id).toBe('smart')
        expect(reader.resolveTier('fast').id).toBe('fast')
    })

    it('serves one snapshot to both readers, so a turn cannot select from one file and bill from another', async () => {
        mockResponse(validPricing)
        const catalog = await loadCatalog()

        const first = await catalog.load()

        expect(catalog.current()).toBe(first)
        expect(await catalog.load()).toBe(first)
    })

    it('finishes start-up even when the pricing file cannot be read', async () => {
        mockFailure()
        const catalog = await loadCatalog()

        await expect(catalog.warmUp()).resolves.toBeUndefined()
        expect(catalog.current().defaultTierId).toBe(DEFAULT_CHAT_TIER_ID)
    })
})
