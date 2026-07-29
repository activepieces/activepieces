import { AgentTurnLogger, AgentTurnResult, AgentTurnToolCall, extractResultText, runAgentTurn } from '@activepieces/core-agent-runtime'
import { AIProviderName } from '@activepieces/core-utils'
import { CHAT_SCHEMA_TOOL_NAMES, chatAiUtils, ContentPartLike } from '@activepieces/server-utils'
import { ChatPhase, chatToolClassification, chatToolPhases, PersistedChatPart } from '@activepieces/shared'
import { LanguageModel, ModelMessage, StopCondition, streamText, ToolSet } from 'ai'

const MAX_RESPONSE_OUTPUT_TOKENS = 32_000

export async function runChatTurn({ model, fastModel, provider, systemPrompt, messages, tools, allToolNames, tier, phaseState, abortSignal, log, sinks, stopWhen }: RunChatTurnParams): Promise<ChatTurnResult> {
    return runAgentTurn<PersistedChatPart>({
        model,
        fastModel,
        provider,
        systemPrompt,
        messages,
        tools,
        maxOutputTokens: tier.thinkingBudget + MAX_RESPONSE_OUTPUT_TOKENS,
        abortSignal,
        log,
        stopWhen,
        drainStream: sinks.drainStream,
        onProgress: sinks.onProgress,
        onStepParts: ({ content }) => chatAiUtils.buildStepParts({ content: content as ContentPartLike[] }),
        isFailure: (result) => chatToolClassification.hasFailureTextPrefix(extractResultText(result)),
        neverCollapseToolNames: CHAT_SCHEMA_TOOL_NAMES,
        currentPhase: () => phaseState.phase,
        prepareStepPolicy: ({ steps, isFirstStep }) => {
            const lastStep = steps[steps.length - 1]
            if (lastStep?.toolCalls?.some((c) => chatToolPhases.isBuildOnlyTool(c.toolName))) {
                phaseState.phase = 'build'
            }
            // Round one runs on the fast model with native thinking OFF, so the opener + first
            // discovery stream out in ~400ms instead of waiting behind the smart model's slower
            // first token and silent thinking budget. Thinking stays OFF for the whole discovery
            // phase, not just round one: extended thinking makes the model deliberate and fire ONE
            // tool per step, serializing read-only lookups that should run as one parallel burst.
            // Once a build-only tool flips the phase to 'build', thinking comes back on.
            const disableThinking = isFirstStep || phaseState.phase === 'discovery'
            return {
                useFastModel: isFirstStep,
                activeTools: chatToolPhases.activeToolsForPhase({ phase: phaseState.phase, allToolNames }),
                providerOptions: chatAiUtils.buildProviderOptions({ provider, tier, disableThinking }),
            }
        },
    })
}

export type ChatTurnToolCall = AgentTurnToolCall

export type ChatTurnResult = AgentTurnResult<PersistedChatPart>

export type RunChatTurnParams = {
    model: LanguageModel
    fastModel?: LanguageModel
    provider: AIProviderName
    systemPrompt: string
    messages: ModelMessage[]
    tools: ToolSet
    allToolNames: string[]
    tier: { id: string, thinkingBudget: number, modelId: string }
    phaseState: { phase: ChatPhase }
    abortSignal: AbortSignal
    log: AgentTurnLogger
    sinks: {
        drainStream: (result: ReturnType<typeof streamText>) => Promise<void>
        onProgress?: (progress: { uiParts: PersistedChatPart[], responseMessages: ModelMessage[] }) => void
    }
    stopWhen?: StopCondition<ToolSet> | Array<StopCondition<ToolSet>>
}
