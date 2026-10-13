import { AIProviderName } from '@activepieces/core-utils'
import { aiProviderUtils } from '@activepieces/shared'
import { AnthropicLanguageModelOptions } from '@ai-sdk/anthropic'
import { SharedV3ProviderOptions } from '@ai-sdk/provider'
import { SystemModelMessage } from 'ai'

function buildProviderOptions({ provider, tier, modelId, disableThinking = false }: { provider: AIProviderName, tier: { id: string, thinkingBudget: number }, modelId: string, disableThinking?: boolean }): SharedV3ProviderOptions {
    switch (provider) {
        case AIProviderName.ANTHROPIC:
        case AIProviderName.BEDROCK:
            return { anthropic: anthropicThinking({ thinkingBudget: tier.thinkingBudget, modelId, disableThinking }) }
        case AIProviderName.ACTIVEPIECES:
        case AIProviderName.OPENROUTER:
            return { openrouter: { cache_control: { type: 'ephemeral' }, reasoning: openRouterReasoning({ thinkingBudget: tier.thinkingBudget, modelId, disableThinking }) } }
        default:
            return {}
    }
}

function anthropicThinking({ thinkingBudget, modelId, disableThinking }: { thinkingBudget: number, modelId: string, disableThinking: boolean }): Pick<AnthropicLanguageModelOptions, 'thinking' | 'effort'> {
    if (ADAPTIVE_ONLY_ANTHROPIC_MODELS.some((family) => modelId.includes(family))) {
        return disableThinking ? { thinking: { type: 'adaptive' }, effort: 'low' } : { thinking: { type: 'adaptive' } }
    }
    return disableThinking ? { thinking: { type: 'disabled' } } : { thinking: { type: 'enabled', budgetTokens: thinkingBudget } }
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

const ADAPTIVE_ONLY_ANTHROPIC_MODELS = ['claude-opus-4-7', 'claude-opus-4-8', 'claude-opus-5', 'claude-sonnet-5', 'claude-haiku-5', 'claude-fable-5', 'claude-mythos-5']

type OpenRouterReasoningDirective =
    | { enabled: false }
    | { effort: 'minimal' }
    | { max_tokens: number }
