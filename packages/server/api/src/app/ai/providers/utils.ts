import { SUPPORTED_AI_PROVIDERS, SupportedAIProvider } from '@activepieces/common-ai'

export function getProviderConfig(provider: string): SupportedAIProvider | undefined {
    return SUPPORTED_AI_PROVIDERS.find((p) => p.provider === provider)
}

export function calculateTokensCost(
    tokens: number,
    costPerMillionTokens: number,
): number {
    return (tokens / 1000000) * costPerMillionTokens
}

export function calculateWebSearchCost(
    webSearchCalls: number,
    costPerWebSearch: number,
): number {
    return webSearchCalls * costPerWebSearch
}
