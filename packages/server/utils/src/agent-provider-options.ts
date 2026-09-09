import { AIProviderName } from '@activepieces/core-utils'
import { aiProviderUtils } from '@activepieces/shared'
import { SharedV3ProviderOptions } from '@ai-sdk/provider'
import { SystemModelMessage } from 'ai'

function buildProviderOptions({ provider, tier, modelId, disableThinking = false }: { provider: AIProviderName, tier: { id: string, thinkingBudget: number }, modelId: string, disableThinking?: boolean }): SharedV3ProviderOptions {
    switch (provider) {
        case AIProviderName.ANTHROPIC:
        case AIProviderName.BEDROCK:
            return { anthropic: { thinking: disableThinking ? { type: 'disabled' } : { type: 'enabled', budgetTokens: tier.thinkingBudget } } }
        case AIProviderName.ACTIVEPIECES:
        case AIProviderName.OPENROUTER:
            return { openrouter: { cache_control: { type: 'ephemeral' }, reasoning: openRouterReasoning({ thinkingBudget: tier.thinkingBudget, modelId, disableThinking }) } }
        default:
            return {}
    }
}

function openRouterReasoning({ thinkingBudget, modelId, disableThinking }: { thinkingBudget: number, modelId: string, disableThinking: boolean }): OpenRouterReasoningDirective {
    if (!disableThinking) {
        return { max_tokens: thinkingBudget }
    }
    return aiProviderUtils.canDisableReasoning({ modelId }) ? { enabled: false } : { effort: 'minimal' }
}

function buildSystemPromptWithCaching({ systemPrompt, provider }: { systemPrompt: string, provider: AIProviderName }): string | SystemModelMessage {
    switch (provider) {
        case AIProviderName.ANTHROPIC:
        case AIProviderName.BEDROCK:
            return { role: 'system', content: systemPrompt, providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } } }
        default:
            return systemPrompt
    }
}

export const agentProviderOptions = {
    buildProviderOptions,
    buildSystemPromptWithCaching,
}

type OpenRouterReasoningDirective =
    | { enabled: false }
    | { effort: 'minimal' }
    | { max_tokens: number }
