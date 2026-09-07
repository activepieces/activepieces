import { AIProviderName } from '@activepieces/core-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()

vi.mock('../src/safe-http', () => ({
    safeHttp: {
        get retryingAxios() {
            return { get }
        },
    },
}))

const CATALOG = {
    notice: 'Model data from models.dev',
    generatedAt: '2026-08-27T00:00:00.000Z',
    providers: {
        [AIProviderName.OPENAI]: {
            'gpt-5.5': { contextTokens: 1_050_000, outputCostPerMillionTokens: 30 },
        },
        [AIProviderName.OPENROUTER]: {
            'anthropic/claude-sonnet-5': { contextTokens: 1_000_000, outputCostPerMillionTokens: 10 },
        },
        [AIProviderName.BEDROCK]: {
            'anthropic.claude-fable-5:0': { contextTokens: 1_000_000 },
        },
    },
}

async function freshCatalog(): Promise<typeof import('../src/model-catalog').modelCatalog> {
    vi.resetModules()
    const { modelCatalog } = await import('../src/model-catalog')
    return modelCatalog
}

async function lookup(provider: AIProviderName, modelId: string): Promise<unknown> {
    const modelCatalog = await freshCatalog()
    const catalog = await modelCatalog.load()
    return catalog.lookup({ provider, modelId })
}

describe('modelCatalog.lookup', () => {
    beforeEach(() => {
        get.mockReset()
        get.mockResolvedValue({ data: CATALOG })
    })

    afterEach(() => {
        vi.useRealTimers()
        delete process.env['AP_MODEL_CATALOG_URL']
    })

    it('returns metadata for a native model id', async () => {
        await expect(lookup(AIProviderName.OPENAI, 'gpt-5.5'))
            .resolves.toEqual(CATALOG.providers[AIProviderName.OPENAI]['gpt-5.5'])
    })

    it('resolves activepieces against the openrouter block', async () => {
        await expect(lookup(AIProviderName.ACTIVEPIECES, 'anthropic/claude-sonnet-5'))
            .resolves.toEqual(CATALOG.providers[AIProviderName.OPENROUTER]['anthropic/claude-sonnet-5'])
    })

    it.each(['us', 'eu', 'apac', 'global'])('strips the bedrock %s inference-profile prefix', async (region) => {
        await expect(lookup(AIProviderName.BEDROCK, `${region}.anthropic.claude-fable-5:0`))
            .resolves.toEqual(CATALOG.providers[AIProviderName.BEDROCK]['anthropic.claude-fable-5:0'])
    })

    it.each([
        [AIProviderName.AZURE, 'my-gpt5-deployment'],
        [AIProviderName.CUSTOM, 'some-self-hosted-model'],
        [AIProviderName.CLOUDFLARE_GATEWAY, 'openai/gpt-4'],
        [AIProviderName.MISTRAL, 'gpt-5.5'],
    ])('returns undefined rather than throwing for %s / %s', async (provider, modelId) => {
        await expect(lookup(provider, modelId)).resolves.toBeUndefined()
    })

    it('fetches once for concurrent lookups', async () => {
        const modelCatalog = await freshCatalog()
        await Promise.all(Array.from({ length: 25 }, () => modelCatalog.load()))
        expect(get).toHaveBeenCalledTimes(1)
    })

    it('reuses the cached catalog across later lookups', async () => {
        const modelCatalog = await freshCatalog()
        await modelCatalog.load()
        await modelCatalog.load()
        expect(get).toHaveBeenCalledTimes(1)
    })

    it('returns undefined and does not throw when the catalog is unreachable', async () => {
        get.mockRejectedValue(new Error('ENOTFOUND cdn.activepieces.com'))
        await expect(lookup(AIProviderName.OPENAI, 'gpt-5.5')).resolves.toBeUndefined()
    })

    it('backs off after a failure instead of refetching on every lookup', async () => {
        get.mockRejectedValue(new Error('ENOTFOUND cdn.activepieces.com'))
        const modelCatalog = await freshCatalog()
        await modelCatalog.load()
        await modelCatalog.load()
        await modelCatalog.load()
        expect(get).toHaveBeenCalledTimes(1)
    })

    it('reads AP_MODEL_CATALOG_URL when set', async () => {
        process.env['AP_MODEL_CATALOG_URL'] = 'https://mirror.internal/model-catalog.json'
        const modelCatalog = await freshCatalog()
        await modelCatalog.load()
        expect(get).toHaveBeenCalledWith('https://mirror.internal/model-catalog.json', expect.anything())
    })
})
