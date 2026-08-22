import { AIProviderName } from '@activepieces/core-utils'
import { describe, expect, it } from 'vitest'
import catalogFile from '../src/model-catalog.generated.json'
import { modelCatalog } from '../src/model-catalog'

const catalog: Record<string, Record<string, unknown>> = catalogFile

function firstModelId(provider: string): string {
    const [modelId] = Object.keys(catalog[provider])
    return modelId
}

describe('modelCatalog.lookup', () => {
    it('returns metadata for a native model id', () => {
        const modelId = firstModelId(AIProviderName.OPENAI)
        expect(modelCatalog.lookup({ provider: AIProviderName.OPENAI, modelId })).toEqual(catalog[AIProviderName.OPENAI][modelId])
    })

    it('strips the bedrock inference-profile region prefix', () => {
        const foundationId = firstModelId(AIProviderName.BEDROCK)
        const expected = catalog[AIProviderName.BEDROCK][foundationId]

        for (const region of ['us', 'eu', 'apac', 'global']) {
            expect(modelCatalog.lookup({ provider: AIProviderName.BEDROCK, modelId: `${region}.${foundationId}` })).toEqual(expected)
        }
    })

    it('keeps the bedrock version suffix, which is part of the upstream id', () => {
        const versioned = Object.keys(catalog[AIProviderName.BEDROCK]).find((id) => id.includes(':'))
        expect(versioned).toBeDefined()
        expect(modelCatalog.lookup({ provider: AIProviderName.BEDROCK, modelId: versioned! })).toBeDefined()
        expect(modelCatalog.lookup({ provider: AIProviderName.BEDROCK, modelId: versioned!.replace(/:\d+$/, '') })).toBeUndefined()
    })

    it('resolves activepieces against the openrouter block', () => {
        const modelId = firstModelId(AIProviderName.OPENROUTER)
        expect(modelCatalog.lookup({ provider: AIProviderName.ACTIVEPIECES, modelId })).toEqual(catalog[AIProviderName.OPENROUTER][modelId])
    })

    it('does not cross-match ids between providers', () => {
        const openAiModelId = firstModelId(AIProviderName.OPENAI)
        expect(modelCatalog.lookup({ provider: AIProviderName.MISTRAL, modelId: openAiModelId })).toBeUndefined()
    })

    it.each([
        [AIProviderName.AZURE, 'my-gpt5-deployment'],
        [AIProviderName.CUSTOM, 'some-self-hosted-model'],
        [AIProviderName.CLOUDFLARE_GATEWAY, 'openai/gpt-4'],
        [AIProviderName.OPENAI, 'ft:gpt-4o:acme::abc123'],
    ])('returns undefined rather than throwing for %s / %s', (provider, modelId) => {
        expect(modelCatalog.lookup({ provider, modelId })).toBeUndefined()
    })
})
