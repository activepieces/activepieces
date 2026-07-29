import { aiProviderUtils } from '@activepieces/core-piece-types'
import { AIProviderName, tryCatch } from '@activepieces/core-utils'
import { SharedV3ProviderOptions } from '@ai-sdk/provider'
import { generateText, isLoopFinished, LanguageModel, LanguageModelUsage, ModelMessage, stepCountIs, StopCondition, streamText, ToolSet } from 'ai'
import { buildSystemPromptWithCaching, collapseStaleToolOutputs, collectStepMessages, ContentPartLike, estimateTokenCount, hasVisibleContent, sanitizeTruncatedAssistantTail, stripThinkingBlocks } from './context'
import { CONTINUE_NUDGE, decideLoopAction, delayWithJitter, EMPTY_OUTPUT_NUDGE, IN_LOOP_COMPACTION_THRESHOLD, MAX_AGENT_STEPS, RUNAWAY_TURN_CONTEXT_MULTIPLE, shouldRetryStream, STREAM_RETRY_BASE_DELAY_MS, wrapToolsWithFailureGuard } from './resilience'

export async function runAgentTurn<TPart = unknown>({
    model,
    fastModel,
    provider,
    systemPrompt,
    messages,
    tools,
    maxOutputTokens,
    maxSteps,
    providerOptions,
    abortSignal,
    log,
    onStepParts,
    isFailure,
    neverCollapseToolNames,
    prepareStepPolicy,
    currentPhase,
    drainStream,
    onProgress,
    stopWhen,
}: RunAgentTurnParams<TPart>): Promise<AgentTurnResult<TPart>> {
    const baseStopCondition = stopWhen ?? isLoopFinished()
    const extraStopConditions = Array.isArray(baseStopCondition) ? baseStopCondition : [baseStopCondition]
    // The step budget is owned here, not by the caller, because each auto-continuation starts a
    // fresh streamText call: a caller-supplied `stepCountIs` would reset every continuation and
    // let one turn run maxSteps times over.
    const stepBudget = maxSteps ?? MAX_AGENT_STEPS
    let stepsUsed = 0
    const guardedTools = wrapToolsWithFailureGuard({ tools, isFailure, log })
    const maxContextTokens = aiProviderUtils.getMaxContextTokens({ provider })
    const maxTurnTokens = maxContextTokens * RUNAWAY_TURN_CONTEXT_MULTIPLE

    const toolCalls: AgentTurnToolCall[] = []
    const uiParts: TPart[] = []
    let visibleStepCount = 0
    let toolCallOrder = 0
    // The cumulative response.messages of the CURRENT streamText attempt, captured per-step in
    // onStepFinish. Folded into accumulatedResponseMessages on EVERY loop exit, so an abort or
    // error never drops the steps that already happened.
    let currentAttemptMessages: ModelMessage[] = []
    let streamError: Error | null = null

    let llmMessages = messages
    const accumulatedResponseMessages: ModelMessage[] = []
    let continuations = 0
    let emptyContinuations = 0
    let streamRetries = 0
    let truncatedAfterRetries = false
    let usage: LanguageModelUsage | undefined
    let totalInputTokens = 0
    let totalOutputTokens = 0
    let lastFinishReason = ''
    let budgetExceeded = false

    const runStreamAttempt = (attemptMessages: ModelMessage[]): ReturnType<typeof streamText> => {
        // Fixed for the whole attempt — measured once instead of re-stringifying the full history
        // on every step, which made the size check quadratic over a long turn.
        const baseMessagesLength = JSON.stringify(attemptMessages).length
        return streamText({
            model,
            maxRetries: 3,
            ...(maxOutputTokens === undefined ? {} : { maxOutputTokens }),
            ...(abortSignal ? { abortSignal } : {}),
            system: buildSystemPromptWithCaching({ systemPrompt, provider }),
            messages: stripThinkingBlocks(attemptMessages, provider),
            tools: guardedTools,
            stopWhen: [...extraStopConditions, stepCountIs(Math.max(1, stepBudget - stepsUsed))],
            // providerOptions/model are supplied per-step by prepareStep (authoritative). A
            // call-level providerOptions would deep-merge into every step and leak an enabled
            // thinking budget back into a step that disabled it.
            prepareStep: ({ steps }) => {
                const policy = prepareStepPolicy?.({ steps, isFirstStep: steps.length === 0 }) ?? {}
                const stepProviderOptions = policy.providerOptions ?? providerOptions
                return {
                    ...(policy.useFastModel && fastModel ? { model: fastModel } : {}),
                    ...(policy.activeTools ? { activeTools: policy.activeTools } : {}),
                    ...(stepProviderOptions ? { providerOptions: stepProviderOptions } : {}),
                    ...boundContextForStep({ baseMessagesLength, steps, systemPrompt, provider, maxContextTokens, attemptMessages, neverCollapseToolNames }),
                }
            },
            experimental_repairToolCall: async ({ toolCall, error }) => {
                log.warn({ toolName: toolCall.toolName, error }, 'Repairing malformed tool call')
                const { data: repaired } = await tryCatch(async () => {
                    const { text } = await generateText({
                        model,
                        ...(abortSignal ? { abortSignal } : {}),
                        prompt: `Fix this malformed JSON tool call for "${toolCall.toolName}". The error was: ${error.message}\n\nOriginal input:\n${toolCall.input}\n\nReturn ONLY the corrected JSON input, nothing else.`,
                    })
                    return { ...toolCall, input: text }
                })
                return repaired ?? null
            },
            experimental_onToolCallFinish: (result) => {
                toolCalls.push({
                    toolName: result.toolCall.toolName,
                    toolCallId: result.toolCall.toolCallId,
                    input: result.toolCall.input,
                    order: toolCallOrder++,
                    ...(currentPhase ? { phase: currentPhase() } : {}),
                })
                log.info({
                    tool: { name: result.toolCall.toolName, callId: result.toolCall.toolCallId, durationMs: result.durationMs },
                    success: result.success,
                }, result.success ? 'Tool call completed' : 'Tool call failed')
            },
            onStepFinish: ({ content, response }) => {
                const parts = content as ContentPartLike[]
                // Visible output is tracked by count, not by inspecting uiParts — a host that only
                // needs "did this step say anything" (the agent step) supplies no onStepParts and
                // so never makes the runtime retain a transcript it will not read.
                if (hasVisibleContent(parts)) {
                    visibleStepCount++
                }
                if (onStepParts) {
                    uiParts.push(...onStepParts({ content: parts }))
                }
                // Persist the LLM history incrementally: a turn preempted or cancelled mid-flight
                // must leave its assistant + tool messages behind so the next run inherits them.
                currentAttemptMessages = collectStepMessages([{ response }])
                if (onProgress) {
                    onProgress({ uiParts: [...uiParts], responseMessages: [...accumulatedResponseMessages, ...currentAttemptMessages] })
                }
            },
            onError: ({ error }) => {
                log.error({ error }, 'Agent streamText error')
                streamError = error instanceof Error ? error : new Error(String(error))
            },
        })
    }

    for (;;) {
        const visibleCountBefore = visibleStepCount
        currentAttemptMessages = []
        const result = runStreamAttempt(llmMessages)
        // A host that renders the stream supplies its own drain; one that only wants the final
        // result still has to pull the stream for the turn to progress, so the default is the
        // SDK's own consume rather than a no-op. `markVisibleOutput` lets a host that has already
        // forwarded partial deltas say so, which suppresses the retry that would duplicate them.
        await (drainStream ? drainStream(result, () => { visibleStepCount++ }) : result.consumeStream())
        const producedVisibleOutput = visibleStepCount > visibleCountBefore
        // On abort/error we leave the loop WITHOUT reaching the clean-exit pushes below, so fold
        // this attempt's completed steps in here — otherwise the turn's work is lost from the
        // saved history even though it already streamed out.
        if (abortSignal?.aborted) {
            accumulatedResponseMessages.push(...currentAttemptMessages)
            break
        }
        if (streamError) {
            if (shouldRetryStream({ producedVisibleOutput, streamRetries })) {
                streamRetries++
                log.warn({ streamRetries, error: streamError }, 'Agent stream failed before any visible output — retrying the turn')
                streamError = null
                await delayWithJitter(STREAM_RETRY_BASE_DELAY_MS)
                continue
            }
            accumulatedResponseMessages.push(...currentAttemptMessages)
            break
        }

        // Reset on success so each turn gets its own one-shot retry, not one per job.
        streamRetries = 0

        const [steps, attemptUsage, finishReason] = await Promise.all([
            result.steps,
            result.usage,
            result.finishReason,
        ])
        stepsUsed += steps.length
        const stepMessages = collectStepMessages(steps)
        usage = attemptUsage
        totalInputTokens += attemptUsage.inputTokens ?? 0
        totalOutputTokens += attemptUsage.outputTokens ?? 0
        lastFinishReason = finishReason

        if (totalInputTokens + totalOutputTokens >= maxTurnTokens) {
            accumulatedResponseMessages.push(...stepMessages)
            budgetExceeded = true
            log.error({ totalInputTokens, totalOutputTokens, maxTurnTokens }, 'Agent turn hit per-turn token budget — stopping to prevent runaway cost')
            break
        }

        const decision = decideLoopAction({ finishReason, producedVisibleOutput, continuations, emptyContinuations })

        if (decision === 'finish') {
            accumulatedResponseMessages.push(...stepMessages)
            if (finishReason === 'length') {
                truncatedAfterRetries = true
                log.error({ continuations }, 'Agent response still truncated after max auto-continuations')
            }
            break
        }

        const sanitizedTail = sanitizeTruncatedAssistantTail(stepMessages)
        const isTruncation = decision === 'continue_truncation'
        if (isTruncation) {
            continuations++
            log.warn({ continuations, outputTokens: attemptUsage.outputTokens }, 'Agent response truncated by output limit — auto-continuing')
        }
        else {
            emptyContinuations++
            log.warn({ emptyContinuations, finishReason }, 'Agent step produced no visible output — auto-continuing')
        }
        accumulatedResponseMessages.push(...sanitizedTail)
        llmMessages = [...llmMessages, ...sanitizedTail, { role: 'user', content: isTruncation ? CONTINUE_NUDGE : EMPTY_OUTPUT_NUDGE }]
    }

    return {
        accumulatedResponseMessages,
        uiParts,
        usage,
        finishReason: lastFinishReason,
        truncatedAfterRetries,
        budgetExceeded,
        streamError,
        continuations,
        totalInputTokens,
        totalOutputTokens,
        toolCalls,
    }
}


/**
 * Within a single streamText call the SDK appends every tool result and re-sends the full history
 * each step, with no built-in size cap — a turn with many or large results can overflow the
 * context window mid-loop. Above a soft threshold, override the step's messages with a collapsed
 * copy (stale oversized tool outputs replaced by a marker, pairing preserved). Below threshold we
 * emit no override so the SDK keeps its own history and Anthropic prompt caching stays warm.
 */
function boundContextForStep({ baseMessagesLength, steps, systemPrompt, provider, maxContextTokens, attemptMessages, neverCollapseToolNames }: {
    baseMessagesLength: number
    steps: Array<{ response: { messages: ModelMessage[] } }>
    systemPrompt: string
    provider: AIProviderName
    maxContextTokens: number
    attemptMessages: ModelMessage[]
    neverCollapseToolNames?: ReadonlySet<string>
}): { messages?: ModelMessage[] } {
    const stepMessages = collectStepMessages(steps)
    const estimatedTokens = estimateTokenCount({ messages: stepMessages, extraLength: baseMessagesLength + systemPrompt.length })
    if (estimatedTokens <= maxContextTokens * IN_LOOP_COMPACTION_THRESHOLD) {
        return {}
    }
    const collapsed = collapseStaleToolOutputs({ messages: [...attemptMessages, ...stepMessages], neverCollapseToolNames })
    return { messages: stripThinkingBlocks(collapsed, provider) }
}

export type AgentTurnLogger = {
    info: (obj: Record<string, unknown>, msg: string) => void
    warn: (obj: Record<string, unknown>, msg: string) => void
    error: (obj: Record<string, unknown>, msg: string) => void
}

export type AgentTurnToolCall = {
    toolName: string
    toolCallId: string
    input: unknown
    order: number
    phase?: string
}

export type RunAgentTurnParams<TPart = unknown> = {
    model: LanguageModel
    fastModel?: LanguageModel
    provider: AIProviderName
    systemPrompt: string
    messages: ModelMessage[]
    tools: ToolSet
    maxOutputTokens?: number
    maxSteps?: number
    providerOptions?: SharedV3ProviderOptions
    abortSignal?: AbortSignal
    log: AgentTurnLogger
    drainStream?: (result: ReturnType<typeof streamText>, markVisibleOutput: () => void) => Promise<void>
    onStepParts?: (params: { content: ContentPartLike[] }) => TPart[]
    onProgress?: (progress: { uiParts: TPart[], responseMessages: ModelMessage[] }) => void
    isFailure?: (result: unknown) => boolean
    neverCollapseToolNames?: ReadonlySet<string>
    prepareStepPolicy?: (params: {
        steps: ReadonlyArray<{ toolCalls?: ReadonlyArray<{ toolName: string }> }>
        isFirstStep: boolean
    }) => { useFastModel?: boolean, activeTools?: string[], providerOptions?: SharedV3ProviderOptions }
    currentPhase?: () => string
    stopWhen?: StopCondition<ToolSet> | Array<StopCondition<ToolSet>>
}

export type AgentTurnResult<TPart = unknown> = {
    accumulatedResponseMessages: ModelMessage[]
    uiParts: TPart[]
    usage: LanguageModelUsage | undefined
    finishReason: string
    truncatedAfterRetries: boolean
    budgetExceeded: boolean
    streamError: Error | null
    continuations: number
    totalInputTokens: number
    totalOutputTokens: number
    toolCalls: AgentTurnToolCall[]
}
