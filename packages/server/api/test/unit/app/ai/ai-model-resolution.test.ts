import { AIProviderName } from '@activepieces/core-utils'
import { ACTIVEPIECES_CHAT_TIERS, DEFAULT_CHAT_TIER_ID } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { aiModelResolution } from '../../../../src/app/ai/ai-model-resolution'

const published = vi.hoisted(() => ({
    tiers: [] as { id: string, label: string, modelId: string, nativeModelId?: string, thinkingBudget: number }[],
    defaultTierId: '',
}))

vi.mock('@activepieces/server-utils', async (importOriginal) => ({
    ...await importOriginal<Record<string, unknown>>(),
    aiPricingCatalog: {
        current: () => ({
            tiers: published.tiers,
            defaultTierId: published.defaultTierId,
            findTierById: (tierId: string) => published.tiers.find((tier) => tier.id === tierId),
            findTierByModelId: (modelId: string) => published.tiers.find((tier) => tier.modelId === modelId),
            resolveTier: (tierId?: string) => published.tiers.find((tier) => tier.id === tierId)
                ?? published.tiers.find((tier) => tier.id === published.defaultTierId)
                ?? published.tiers[0],
        }),
    },
}))

beforeEach(() => {
    published.tiers = ACTIVEPIECES_CHAT_TIERS.map((tier) => ({ ...tier }))
    published.defaultTierId = DEFAULT_CHAT_TIER_ID
})

const resolve = ({ provider, modelId }: { provider: AIProviderName, modelId: string }) =>
    aiModelResolution.resolveTierModelId({ provider, modelId })

describe('resolveTierModelId', () => {
    it('resolves a published tier id to the model it points at', () => {
        expect(resolve({ provider: AIProviderName.ACTIVEPIECES, modelId: 'smart' })).toBe('anthropic/claude-sonnet-4.6')
    })

    it('leaves a concrete model id alone, so a step saved before tiers keeps its own model', () => {
        expect(resolve({ provider: AIProviderName.ACTIVEPIECES, modelId: 'anthropic/claude-haiku-4.5' })).toBe('anthropic/claude-haiku-4.5')
    })

    it('leaves a model id that matches no tier alone, because the old dropdown offered the whole catalog', () => {
        expect(resolve({ provider: AIProviderName.ACTIVEPIECES, modelId: 'openai/gpt-4o-mini' })).toBe('openai/gpt-4o-mini')
    })

    it('falls back to the default tier when the published file no longer carries that tier', () => {
        expect(resolve({ provider: AIProviderName.ACTIVEPIECES, modelId: 'ultra' })).toBe('anthropic/claude-sonnet-4.6')
    })

    it('reads the published file, not the tiers bundled with the release', () => {
        published.tiers = [{ id: 'smart', label: 'Expert', modelId: 'anthropic/claude-sonnet-5', thinkingBudget: 10_000 }]
        expect(resolve({ provider: AIProviderName.ACTIVEPIECES, modelId: 'smart' })).toBe('anthropic/claude-sonnet-5')
    })

    it('never touches a model on a provider the customer brought their own key for', () => {
        expect(resolve({ provider: AIProviderName.OPENAI, modelId: 'smart' })).toBe('smart')
        expect(resolve({ provider: AIProviderName.ANTHROPIC, modelId: 'claude-sonnet-4-6' })).toBe('claude-sonnet-4-6')
    })

    it('leaves the AI Router model alone', () => {
        expect(resolve({ provider: AIProviderName.ACTIVEPIECES, modelId: 'typesafe/jev-1.13' })).toBe('typesafe/jev-1.13')
    })
})
