import { AIProviderName, isNil } from '@activepieces/core-utils'
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
    const effortFamily = EFFORT_REASONING_FAMILIES.find((family) => modelId.startsWith(family.prefix))
    if (!isNil(effortFamily)) {
        return { effort: effortFor({ family: effortFamily, thinkingBudget, disableThinking }) }
    }
    if (!disableThinking) {
        return { max_tokens: thinkingBudget }
    }
    return aiProviderUtils.canDisableReasoning({ modelId }) ? { enabled: false } : { effort: 'minimal' }
}

function effortFor({ family, thinkingBudget, disableThinking }: { family: EffortReasoningFamily, thinkingBudget: number, disableThinking: boolean }): ReasoningEffort {
    if (disableThinking || thinkingBudget <= 0) {
        return family.lowestEffort
    }
    if (thinkingBudget >= MAX_EFFORT_THINKING_BUDGET && family.supportsMaxEffort) {
        return 'max'
    }
    return thinkingBudget >= HIGH_EFFORT_THINKING_BUDGET ? 'high' : 'low'
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

const HIGH_EFFORT_THINKING_BUDGET = 8_000
const MAX_EFFORT_THINKING_BUDGET = 16_000
const EFFORT_REASONING_FAMILIES: readonly EffortReasoningFamily[] = [
    { prefix: 'z-ai/', lowestEffort: 'low', supportsMaxEffort: false },
    { prefix: 'deepseek/', lowestEffort: 'none', supportsMaxEffort: true },
]
const ADAPTIVE_ONLY_ANTHROPIC_MODELS = ['claude-opus-4-7', 'claude-opus-4-8', 'claude-opus-5', 'claude-sonnet-5', 'claude-haiku-5', 'claude-fable-5', 'claude-mythos-5']

type ReasoningEffort = 'none' | 'low' | 'high' | 'max'

type EffortReasoningFamily = {
    prefix: string
    lowestEffort: ReasoningEffort
    supportsMaxEffort: boolean
}

type OpenRouterReasoningDirective =
    | { enabled: false }
    | { effort: 'minimal' | ReasoningEffort }
    | { max_tokens: number }
