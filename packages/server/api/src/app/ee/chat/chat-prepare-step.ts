import { AIProviderName } from '@activepieces/shared'
import { SharedV3ProviderOptions } from '@ai-sdk/provider'
import { FastifyBaseLogger } from 'fastify'
import { chatToolCategories } from './tools/chat-tool-categories'

function classifyPhase({ steps }: { steps: ReadonlyArray<StepData> }): StepPhase {
    for (let i = steps.length - 1; i >= 0; i--) {
        for (const tc of steps[i].toolCalls) {
            if (tc.toolName === 'ap_validate_flow') return 'finalizing'
            if (tc.toolName === 'ap_create_flow') return 'building'
        }
    }

    for (const step of steps) {
        if (step.text.includes('```automation-proposal')) return 'planning'
    }

    return 'research'
}

function createPrepareStep({ provider, allToolNames, log, supportsThinking }: CreatePrepareStepParams) {
    const researchPhaseTools = allToolNames.filter(chatToolCategories.isResearchPhaseTool)

    return ({ stepNumber, steps }: { stepNumber: number, steps: ReadonlyArray<StepData> }): PrepareStepReturn => {
        const phase = classifyPhase({ steps })
        log.debug({ stepNumber, phase, stepCount: steps.length }, 'Chat step phase')

        const shouldFilterTools = phase === 'research' && stepNumber > 0
        const activeTools = shouldFilterTools ? researchPhaseTools : undefined

        const providerOptions = resolveStepProviderOptions({
            provider,
            phase,
            supportsThinking,
        })

        const hasOverrides = activeTools || providerOptions
        if (!hasOverrides) return undefined

        return {
            ...(activeTools ? { activeTools } : {}),
            ...(providerOptions ? { providerOptions } : {}),
        }
    }
}

// Both hyphen (API) and dot (display) formats — providers use different separators
const THINKING_CAPABLE_MODELS = new Set([
    'claude-sonnet-4-6', 'claude-opus-4-7', 'claude-haiku-4-5',
    'claude-sonnet-4.6', 'claude-opus-4.7', 'claude-haiku-4.5',
])

function isThinkingCapable({ modelId }: { modelId: string }): boolean {
    const bareModel = modelId.replace(/^[^/]+\//, '')
    return THINKING_CAPABLE_MODELS.has(bareModel)
}

const PHASE_THINKING_BUDGET: Record<StepPhase, number> = {
    research: 5_000,
    planning: 10_000,
    building: 20_000,
    finalizing: 10_000,
}

const PHASE_OPENROUTER_EFFORT: Record<StepPhase, string> = {
    research: 'low',
    planning: 'medium',
    building: 'high',
    finalizing: 'medium',
}

function resolveStepProviderOptions({ provider, phase, supportsThinking }: {
    provider: AIProviderName
    phase: StepPhase
    supportsThinking: boolean
}): SharedV3ProviderOptions | undefined {
    if (!supportsThinking) return undefined

    switch (provider) {
        case AIProviderName.ANTHROPIC:
        case AIProviderName.BEDROCK:
            return {
                anthropic: {
                    thinking: { type: 'enabled', budgetTokens: PHASE_THINKING_BUDGET[phase] },
                },
            }
        case AIProviderName.ACTIVEPIECES:
        case AIProviderName.OPENROUTER:
            return {
                openrouter: {
                    reasoning: { effort: PHASE_OPENROUTER_EFFORT[phase] },
                },
            }
        default:
            return undefined
    }
}

type StepPhase = 'research' | 'planning' | 'building' | 'finalizing'

type StepData = {
    readonly toolCalls: ReadonlyArray<{ readonly toolName: string }>
    readonly text: string
}

type PrepareStepReturn = {
    activeTools?: string[]
    providerOptions?: SharedV3ProviderOptions
} | undefined

type CreatePrepareStepParams = {
    provider: AIProviderName
    allToolNames: string[]
    log: FastifyBaseLogger
    supportsThinking: boolean
}

export const chatPrepareStep = {
    createPrepareStep,
    isThinkingCapable,
}
