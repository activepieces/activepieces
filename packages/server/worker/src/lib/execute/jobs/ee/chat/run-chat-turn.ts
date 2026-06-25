import { AIProviderName, isObject, tryCatch, tryCatchSync } from '@activepieces/core-utils'
import { chatAiUtils, ContentPartLike } from '@activepieces/server-utils'
import { aiProviderUtils, ChatPhase, chatToolClassification, chatToolPhases, PersistedChatPart } from '@activepieces/shared'
import { generateText, isLoopFinished, LanguageModel, LanguageModelUsage, ModelMessage, stepCountIs, StopCondition, streamText, ToolCallOptions, ToolSet } from 'ai'

const MAX_RESPONSE_OUTPUT_TOKENS = 32_000
const MAX_AUTO_CONTINUATIONS = 3
const MAX_EMPTY_CONTINUATIONS = 2
const MAX_STREAM_RETRIES = 1
const MAX_AGENT_STEPS = 50
const MAX_IDENTICAL_TOOL_FAILURES = 2
const IN_LOOP_COMPACTION_THRESHOLD = 0.6
const STREAM_RETRY_BASE_DELAY_MS = 1_000
const CONTINUE_NUDGE = '[system note — not from the user] Your previous response was cut off by the output token limit before it finished. Continue exactly where you stopped. If a tool call was cut off, re-issue it in FULL. Do not repeat content you already produced.'
const EMPTY_OUTPUT_NUDGE = '[system note — not from the user] Your previous step produced no visible reply to the user. Continue the task now: either call the next tool, or write your reply to the user. Do not stop silently.'

export function decideLoopAction({ finishReason, producedVisibleOutput, continuations, emptyContinuations }: {
    finishReason: string
    producedVisibleOutput: boolean
    continuations: number
    emptyContinuations: number
}): LoopDecision {
    if (finishReason === 'length') {
        return continuations >= MAX_AUTO_CONTINUATIONS ? 'finish' : 'continue_truncation'
    }
    if (!producedVisibleOutput && emptyContinuations < MAX_EMPTY_CONTINUATIONS) {
        return 'continue_empty'
    }
    return 'finish'
}

export function shouldRetryStream({ producedVisibleOutput, streamRetries }: {
    producedVisibleOutput: boolean
    streamRetries: number
}): boolean {
    return !producedVisibleOutput && streamRetries < MAX_STREAM_RETRIES
}

export async function runChatTurn({ model, fastModel, provider, systemPrompt, messages, tools, allToolNames, tier, phaseState, abortSignal, log, sinks, stopWhen }: RunChatTurnParams): Promise<ChatTurnResult> {
    const drainStream = sinks?.drainStream ?? (async () => {})
    const onProgress = sinks?.onProgress ?? (() => {})
    const baseStopCondition = stopWhen ?? isLoopFinished()
    const loopStopCondition = [
        ...(Array.isArray(baseStopCondition) ? baseStopCondition : [baseStopCondition]),
        stepCountIs(MAX_AGENT_STEPS),
    ]
    const guardedTools = wrapToolsWithFailureGuard({ tools, log })

    const uiParts: PersistedChatPart[] = []
    const toolCalls: ChatTurnToolCall[] = []
    let toolCallOrder = 0
    let abortedStepMessages: ModelMessage[] = []
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

    const runStreamAttempt = (attemptMessages: ModelMessage[]): ReturnType<typeof streamText> => streamText({
        model,
        maxRetries: 3,
        maxOutputTokens: tier.thinkingBudget + MAX_RESPONSE_OUTPUT_TOKENS,
        abortSignal,
        system: chatAiUtils.buildSystemPromptWithCaching({ systemPrompt, provider }),
        messages: chatAiUtils.stripThinkingBlocks(attemptMessages, provider),
        tools: guardedTools,
        stopWhen: loopStopCondition,
        // providerOptions/model are supplied per-step by prepareStep (authoritative). A
        // call-level providerOptions would deep-merge into every step and leak the enabled
        // thinking budget back into the disabled first step.
        prepareStep: ({ steps }) => {
            const lastStep = steps[steps.length - 1]
            const widened = lastStep?.toolCalls?.some((c) => chatToolPhases.isBuildOnlyTool(c.toolName))
            if (widened) {
                phaseState.phase = 'build'
            }
            // Round one of the loop runs on the fast model with native thinking OFF, so the
            // opener ("Lead with text") + first discovery stream out in ~400ms instead of
            // waiting behind the smart model's slower first token and silent thinking budget.
            // From round two we switch to the smart model with thinking ON for planning depth.
            // It's one continuous turn (no second call), so there's no double-greeting.
            const isFirstStep = steps.length === 0
            return {
                ...(isFirstStep && fastModel ? { model: fastModel } : {}),
                activeTools: chatToolPhases.activeToolsForPhase({ phase: phaseState.phase, allToolNames }),
                providerOptions: chatAiUtils.buildProviderOptions({ provider, tier, disableThinking: isFirstStep }),
                ...boundContextForStep({ baseMessages: attemptMessages, steps, systemPrompt, provider }),
            }
        },
        experimental_repairToolCall: async ({ toolCall, error }) => {
            log.warn({ toolName: toolCall.toolName, error }, 'Repairing malformed tool call')
            const { data: repaired } = await tryCatch(async () => {
                const { text } = await generateText({
                    model,
                    abortSignal,
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
                phase: phaseState.phase,
            })
            log.debug({
                tool: { name: result.toolCall.toolName, callId: result.toolCall.toolCallId, phase: phaseState.phase, durationMs: result.durationMs, input: result.toolCall.input },
                success: result.success,
            }, 'Tool call I/O')
            if (result.success) {
                log.info({ tool: { name: result.toolCall.toolName, durationMs: result.durationMs } }, 'Tool call completed')
            }
            else {
                log.warn({ tool: { name: result.toolCall.toolName, durationMs: result.durationMs }, error: result.error }, 'Tool call failed')
            }
        },
        onAbort: ({ steps }) => {
            abortedStepMessages = chatAiUtils.collectStepMessages(steps)
        },
        onStepFinish: ({ content }) => {
            uiParts.push(...chatAiUtils.buildStepParts({ content: content as ContentPartLike[] }))
            onProgress([...uiParts])
            log.debug({ partCount: uiParts.length, phase: phaseState.phase }, 'Chat step finished')
        },
        onError: ({ error }) => {
            log.error({ error }, 'Chat streamText error')
            streamError = error instanceof Error ? error : new Error(String(error))
        },
    })

    for (;;) {
        log.debug({ phase: phaseState.phase, continuations, emptyContinuations, streamRetries }, 'Chat turn loop iteration')
        const uiPartsCountBefore = uiParts.length
        const result = runStreamAttempt(llmMessages)
        await drainStream(result)
        const producedVisibleOutput = uiParts.length > uiPartsCountBefore
        if (abortSignal.aborted) break
        if (streamError) {
            if (shouldRetryStream({ producedVisibleOutput, streamRetries })) {
                streamRetries++
                log.warn({ streamRetries, error: streamError }, 'Chat stream failed before any visible output — retrying the turn')
                streamError = null
                await delayWithJitter(STREAM_RETRY_BASE_DELAY_MS)
                continue
            }
            break
        }

        // Reset on success so each turn gets its own one-shot retry, not one per job.
        streamRetries = 0

        const [steps, attemptUsage, finishReason] = await Promise.all([
            result.steps,
            result.usage,
            result.finishReason,
        ])
        const stepMessages = chatAiUtils.collectStepMessages(steps)
        usage = attemptUsage
        totalInputTokens += attemptUsage.inputTokens ?? 0
        totalOutputTokens += attemptUsage.outputTokens ?? 0
        lastFinishReason = finishReason

        const decision = decideLoopAction({ finishReason, producedVisibleOutput, continuations, emptyContinuations })

        if (decision === 'finish') {
            accumulatedResponseMessages.push(...stepMessages)
            if (finishReason === 'length') {
                truncatedAfterRetries = true
                log.error({ continuations }, 'Chat response still truncated after max auto-continuations')
            }
            break
        }

        const sanitizedTail = chatAiUtils.sanitizeTruncatedAssistantTail(stepMessages)
        if (decision === 'continue_truncation') {
            continuations++
            log.warn({ continuations, outputTokens: attemptUsage.outputTokens }, 'Chat response truncated by output limit — auto-continuing')
            accumulatedResponseMessages.push(...sanitizedTail)
            llmMessages = [...llmMessages, ...sanitizedTail, { role: 'user', content: CONTINUE_NUDGE }]
            continue
        }

        emptyContinuations++
        log.warn({ emptyContinuations, finishReason }, 'Chat step produced no visible output — auto-continuing')
        accumulatedResponseMessages.push(...sanitizedTail)
        llmMessages = [...llmMessages, ...sanitizedTail, { role: 'user', content: EMPTY_OUTPUT_NUDGE }]
    }

    return {
        accumulatedResponseMessages,
        abortedStepMessages,
        uiParts,
        usage,
        finishReason: lastFinishReason,
        truncatedAfterRetries,
        streamError,
        continuations,
        totalInputTokens,
        totalOutputTokens,
        toolCalls,
    }
}

export function delayWithJitter(baseMs: number): Promise<void> {
    const jitter = Math.random() * 0.5 + 0.75
    return new Promise((resolve) => setTimeout(resolve, baseMs * jitter))
}

// Centralized loop-breaker: an identical (tool + input) call that already failed
// MAX_IDENTICAL_TOOL_FAILURES times is short-circuited with a directive to change
// approach, instead of letting the model re-fire the same failing call indefinitely.
function wrapToolsWithFailureGuard({ tools, log }: { tools: ToolSet, log: ChatTurnLogger }): ToolSet {
    const failureCounts = new Map<string, number>()
    const guarded: ToolSet = {}
    for (const [name, toolDef] of Object.entries(tools)) {
        const originalExecute = toolDef.execute
        if (typeof originalExecute !== 'function') {
            guarded[name] = toolDef
            continue
        }
        guarded[name] = {
            ...toolDef,
            execute: async (input: unknown, options: ToolCallOptions) => {
                const key = `${name}::${fingerprintInput(input)}`
                if ((failureCounts.get(key) ?? 0) >= MAX_IDENTICAL_TOOL_FAILURES) {
                    log.warn({ tool: { name } }, 'Short-circuited repeated failing tool call')
                    return { content: [{ type: 'text', text: `✋ This exact ${name} call already failed ${MAX_IDENTICAL_TOOL_FAILURES} times with the same input — it was NOT retried. Stop repeating it: change the parameters based on the error, or switch to a different approach or tool. Do not re-send the identical call.` }] }
                }
                const result = await originalExecute(input, options)
                const text = extractResultText(result)
                if (text.length > 0 && chatToolClassification.hasFailureTextPrefix(text)) {
                    failureCounts.set(key, (failureCounts.get(key) ?? 0) + 1)
                }
                else {
                    failureCounts.delete(key)
                }
                return result
            },
        }
    }
    return guarded
}

function fingerprintInput(input: unknown): string {
    const { data } = tryCatchSync(() => JSON.stringify(input))
    return data ?? ''
}

/**
 * Within a single streamText call the SDK appends every tool result and re-sends
 * the full history each step, with no built-in size cap — a turn with many or
 * large results can overflow the context window mid-loop. Above a soft threshold,
 * override the step's messages with a collapsed copy (stale oversized tool outputs
 * replaced by a marker, pairing preserved). Below threshold we emit no override so
 * the SDK keeps its own history and Anthropic prompt caching stays warm.
 */
function boundContextForStep({ baseMessages, steps, systemPrompt, provider }: {
    baseMessages: ModelMessage[]
    steps: Array<{ response: { messages: ModelMessage[] } }>
    systemPrompt: string
    provider: AIProviderName
}): { messages?: ModelMessage[] } {
    const candidate = [...baseMessages, ...chatAiUtils.collectAllStepMessages(steps)]
    const estimatedTokens = chatAiUtils.estimateTokenCount({ messages: candidate, systemPromptLength: systemPrompt.length })
    const maxContext = aiProviderUtils.getMaxContextTokens({ provider })
    if (estimatedTokens <= maxContext * IN_LOOP_COMPACTION_THRESHOLD) {
        return {}
    }
    const collapsed = chatAiUtils.collapseStaleToolOutputs({ messages: candidate })
    return { messages: chatAiUtils.stripThinkingBlocks(collapsed, provider) }
}

function extractResultText(result: unknown): string {
    if (typeof result === 'string') {
        return result
    }
    if (!isObject(result)) {
        return ''
    }
    if (typeof result['text'] === 'string') {
        return result['text']
    }
    if (Array.isArray(result['content'])) {
        return result['content'].map((part) => isObject(part) && typeof part['text'] === 'string' ? part['text'] : '').join(' ')
    }
    if (isObject(result['value'])) {
        return extractResultText(result['value'])
    }
    return ''
}

type LoopDecision = 'finish' | 'continue_truncation' | 'continue_empty'

type ChatTurnLogger = {
    debug: (obj: Record<string, unknown>, msg: string) => void
    info: (obj: Record<string, unknown>, msg: string) => void
    warn: (obj: Record<string, unknown>, msg: string) => void
    error: (obj: Record<string, unknown>, msg: string) => void
}

export type ChatTurnToolCall = {
    toolName: string
    toolCallId: string
    input: unknown
    order: number
    phase: ChatPhase
}

export type ChatTurnSinks = {
    drainStream?: (result: ReturnType<typeof streamText>) => Promise<void>
    onProgress?: (uiParts: PersistedChatPart[]) => void
}

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
    log: ChatTurnLogger
    sinks?: ChatTurnSinks
    stopWhen?: StopCondition<ToolSet> | Array<StopCondition<ToolSet>>
}

export type ChatTurnResult = {
    accumulatedResponseMessages: ModelMessage[]
    abortedStepMessages: ModelMessage[]
    uiParts: PersistedChatPart[]
    usage: LanguageModelUsage | undefined
    finishReason: string
    truncatedAfterRetries: boolean
    streamError: Error | null
    continuations: number
    totalInputTokens: number
    totalOutputTokens: number
    toolCalls: ChatTurnToolCall[]
}
