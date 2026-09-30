import { ModelTier, ModelTierReader, ModelTierSurface } from '@activepieces/server-utils'

function buildReader({ tiers, defaultTierId, fastTierId }: { tiers: ModelTier[], defaultTierId: string, fastTierId: string }): ModelTierReader {
    const byId = new Map(tiers.map((tier) => [tier.id, tier]))
    const defaultTier = byId.get(defaultTierId) ?? tiers[0]
    return {
        tiers,
        defaultTierId,
        fastTierId,
        findTier: ({ tierId }) => byId.get(tierId),
        resolveTier: ({ tierId }) => (tierId ? byId.get(tierId) : undefined) ?? defaultTier,
    }
}

const FLOW_TIERS: ModelTier[] = [
    { id: 'fast', label: 'Fast', modelId: 'anthropic/claude-haiku-4.5', nativeModelId: 'claude-haiku-4-5', thinkingBudget: 5_000 },
    { id: 'smart', label: 'Expert', modelId: 'anthropic/claude-sonnet-4.6', nativeModelId: 'claude-sonnet-4-6', thinkingBudget: 10_000 },
    { id: 'premium', label: 'Heavy', modelId: 'anthropic/claude-opus-4.8', nativeModelId: 'claude-opus-4-7', thinkingBudget: 20_000 },
    { id: 'deep', label: 'Deep', modelId: 'anthropic/claude-fable-5.1', thinkingBudget: 30_000 },
]

const CHAT_TIERS: ModelTier[] = [
    { id: 'fast', label: 'Fast', modelId: 'anthropic/claude-haiku-4.5', nativeModelId: 'claude-haiku-4-5', thinkingBudget: 5_000 },
    { id: 'smart', label: 'Expert', modelId: 'google/gemini-3.7-flash', thinkingBudget: 10_000 },
    { id: 'turbo', label: 'Turbo', modelId: 'openai/gpt-5.5', thinkingBudget: 2_000 },
]

export const publishedTierReaders: Record<ModelTierSurface, ModelTierReader> = {
    flow: buildReader({ tiers: FLOW_TIERS, defaultTierId: 'smart', fastTierId: 'fast' }),
    chat: buildReader({ tiers: CHAT_TIERS, defaultTierId: 'smart', fastTierId: 'turbo' }),
}

export const publishedModelTierCatalog = {
    warmUp: async (): Promise<void> => undefined,
    current: (surface: ModelTierSurface): ModelTierReader => publishedTierReaders[surface],
}
