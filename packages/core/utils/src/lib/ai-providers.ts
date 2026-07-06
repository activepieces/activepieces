export const ACTIVEPIECES_CHAT_TIERS = [
    { id: 'fast', label: 'Fast', modelId: 'anthropic/claude-haiku-4.5', thinkingBudget: 5_000, creditWeight: 2 },
    { id: 'smart', label: 'Expert', modelId: 'anthropic/claude-sonnet-4.6', thinkingBudget: 10_000, creditWeight: 10 },
    { id: 'premium', label: 'Heavy', modelId: 'anthropic/claude-opus-4.8', thinkingBudget: 20_000, creditWeight: 20 },
] as const

export const DEFAULT_CHAT_TIER_ID = 'smart' as const

export type ActivepiecesChatTier = typeof ACTIVEPIECES_CHAT_TIERS[number]
