import { SUPPORTED_AI_PROVIDERS, SupportedAIProvider } from '@activepieces/shared'

export function getProviderConfig(provider: string): SupportedAIProvider | undefined {
    return SUPPORTED_AI_PROVIDERS.find((p) => p.provider === provider)
}

export function calculateTokensCost(
    inputTokens: number,
    outputTokens: number,
    inputCostPerMillionTokens: number,
    outputCostPerMillionTokens: number,
): number {
    return (inputTokens / 1000000) * inputCostPerMillionTokens + (outputTokens / 1000000) * outputCostPerMillionTokens
} 