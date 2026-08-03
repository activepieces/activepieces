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
const RUNAWAY_TURN_CONTEXT_MULTIPLE = 90
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

const CREDIT_ERROR_PATTERNS = [/credits/i, /\b402\b/, /payment.required/i]

export function isCreditExhaustedError(message: string): boolean {
    return CREDIT_ERROR_PATTERNS.some((pattern) => pattern.test(message))
}

// Failover policy for a failed stream attempt. Credit exhaustion is a billing state, never an
// outage — it stops the chain. Transient errors get one same-slot retry (today's behavior);
// anything else moves to the next slot (a revoked key is exactly what backups exist for). With a
// single-slot chain this degrades to exactly the pre-routing semantics: one retry, then stop.
export function decideStreamFailureAction({ errorMessage, producedVisibleOutput, sameSlotRetries, hasNextSlot }: {
    errorMessage: string
    producedVisibleOutput: boolean
    sameSlotRetries: number
    hasNextSlot: boolean
}): StreamFailureAction {
    if (producedVisibleOutput) {
        return 'stop'
    }
    if (isCreditExhaustedError(errorMessage)) {
        return 'stop'
    }
    if (isTransientFailureText(errorMessage) && sameSlotRetries < MAX_STREAM_RETRIES) {
        return 'retry_slot'
    }
    if (hasNextSlot) {
        return 'advance_slot'
    }
    return sameSlotRetries < MAX_STREAM_RETRIES ? 'retry_slot' : 'stop'
}

export async function runChatTurn({ slots, systemPrompt, messages, tier, phaseState, abortSignal, log, sinks, stopWhen }: RunChatTurnParams): Promise<ChatTurnResult> {
    const drainStream = sinks?.drainStream ?? (async () => {})
    const onProgress = sinks?.onProgress ?? (() => {})
    const baseStopCondition = stopWhen ?? isLoopFinished()
    const loopStopCondition = [
        ...(Array.isArray(baseStopCondition) ? baseStopCondition : [baseStopCondition]),
        stepCountIs(MAX_AGENT_STEPS),
    ]
    const failureCounts = new Map<string, number>()
    const guardedToolsBySlot = slots.map((slot) => wrapToolsWithFailureGuard({ tools: slot.tools, log, failureCounts }))
    const maxTurnTokens = runawayTokenCeiling(slots[0].provider)
    let slotIndex = 0

    const uiParts: PersistedChatPart[] = []
    const toolCalls: ChatTurnToolCall[] = []
    let toolCallOrder = 0
    // The cumulative response.messages of the CURRENT streamText attempt, captured per-step in
    // onStepFinish (the reliable source — mirrors what we stream to the UI). Folded into
    // accumulatedResponseMessages on EVERY loop exit, so an abort/error break never drops the
    // steps that already happened (which previously left the saved LLM history as just [user]).
    let currentAttemptMessages: ModelMessage[] = []
    const streamFailure: { error: Error | null } = { error: null }

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
        const slot = slots[slotIndex]
        const provider = slot.provider
        return streamText({
            model: slot.model,
            maxRetries: 3,
            maxOutputTokens: tier.thinkingBudget + MAX_RESPONSE_OUTPUT_TOKENS,
            abortSignal,
            system: chatAiUtils.buildSystemPromptWithCaching({ systemPrompt, provider }),
            messages: chatAiUtils.stripThinkingBlocks(attemptMessages, provider),
            tools: guardedToolsBySlot[slotIndex],
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
                // Thinking stays OFF for the whole discovery phase, not just round one: extended
                // thinking makes the model deliberate and fire ONE tool per step, serializing the
                // read-only lookups that should run as one parallel burst. Once a build-only tool
                // flips the phase to 'build', thinking comes back on for planning depth.
                const disableThinking = isFirstStep || phaseState.phase === 'discovery'
                return {
                    ...(isFirstStep && slot.fastModel ? { model: slot.fastModel } : {}),
                    activeTools: chatToolPhases.activeToolsForPhase({ phase: phaseState.phase, allToolNames: Object.keys(slot.tools) }),
                    providerOptions: chatAiUtils.buildProviderOptions({ provider, tier, disableThinking }),
                    ...boundContextForStep({ baseMessages: attemptMessages, steps, systemPrompt, provider }),
                }
            },
            experimental_repairToolCall: async ({ toolCall, error }) => {
                log.warn({ toolName: toolCall.toolName, error }, 'Repairing malformed tool call')
                const { data: repaired } = await tryCatch(async () => {
                    const { text } = await generateText({
                        model: slot.model,
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
            onStepFinish: ({ content, response }) => {
                uiParts.push(...chatAiUtils.buildStepParts({ content: content as ContentPartLike[] }))
                // Persist the LLM history incrementally (not just UI parts): a turn preempted or
                // cancelled mid-flight must leave its assistant + tool messages behind so the next
                // run inherits them instead of re-discovering from scratch. accumulatedResponseMessages
                // holds prior continuation attempts; this step's response.messages is cumulative for
                // the current attempt (collectStepMessages takes the last step).
                currentAttemptMessages = chatAiUtils.collectStepMessages([{ response }])
                const responseMessages = [...accumulatedResponseMessages, ...currentAttemptMessages]
                onProgress({ uiParts: [...uiParts], responseMessages })
                log.debug({ partCount: uiParts.length, phase: phaseState.phase }, 'Chat step finished')
            },
            onError: ({ error }) => {
                log.error({ error }, 'Chat streamText error')
                streamFailure.error = error instanceof Error ? error : new Error(String(error))
            },
        })
    }

    for (;;) {
        log.debug({ phase: phaseState.phase, continuations, emptyContinuations, streamRetries, slotIndex }, 'Chat turn loop iteration')
        const uiPartsCountBefore = uiParts.length
        currentAttemptMessages = []
        const result = runStreamAttempt(llmMessages)
        await drainStream(result)
        const producedVisibleOutput = uiParts.length > uiPartsCountBefore
        // On abort/error we leave the loop WITHOUT reaching the clean-exit pushes below, so fold
        // this attempt's completed steps in here — otherwise the turn's work is lost from the
        // saved LLM history even though it streamed to the UI.
        if (abortSignal.aborted) {
            accumulatedResponseMessages.push(...currentAttemptMessages)
            break
        }
        const attemptError = streamFailure.error
        if (attemptError) {
            const action = decideStreamFailureAction({
                errorMessage: attemptError.message,
                producedVisibleOutput,
                sameSlotRetries: streamRetries,
                hasNextSlot: slotIndex < slots.length - 1,
            })
            if (action === 'retry_slot') {
                streamRetries++
                log.warn({ streamRetries, error: attemptError }, 'Chat stream failed before any visible output — retrying the turn')
                streamFailure.error = null
                await delayWithJitter(STREAM_RETRY_BASE_DELAY_MS)
                continue
            }
            if (action === 'advance_slot') {
                slotIndex++
                streamRetries = 0
                log.warn({ aiRouting: { tier: tier.id, slot: slotIndex, provider: slots[slotIndex].provider }, error: attemptError }, 'Chat stream failed — failing over to backup model')
                streamFailure.error = null
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
        const stepMessages = chatAiUtils.collectStepMessages(steps)
        usage = attemptUsage
        totalInputTokens += attemptUsage.inputTokens ?? 0
        totalOutputTokens += attemptUsage.outputTokens ?? 0
        lastFinishReason = finishReason

        if (totalInputTokens + totalOutputTokens >= maxTurnTokens) {
            accumulatedResponseMessages.push(...stepMessages)
            budgetExceeded = true
            log.error({ totalInputTokens, totalOutputTokens, maxTurnTokens }, 'Chat turn hit per-turn token budget — stopping to prevent runaway cost')
            break
        }

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
        uiParts,
        usage,
        finishReason: lastFinishReason,
        truncatedAfterRetries,
        budgetExceeded,
        streamError: streamFailure.error,
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
function wrapToolsWithFailureGuard({ tools, log, failureCounts }: { tools: ToolSet, log: ChatTurnLogger, failureCounts: Map<string, number> }): ToolSet {
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
                    log.warn({ tool: { name } }, 'Short-circuited repeated unproductive tool call')
                    return { content: [{ type: 'text', text: `✋ This exact ${name} call already came back the same unproductive way ${MAX_IDENTICAL_TOOL_FAILURES} times (an error, or an empty result) and was NOT retried. Stop repeating it: change the parameters, switch the action (e.g. a list/search action instead of a find-one), or try a different approach. Do not re-send the identical call.` }] }
                }
                const result = await originalExecute(input, options)
                const text = extractResultText(result)
                const isFailure = text.length > 0 && chatToolClassification.hasFailureTextPrefix(text)
                const isEmptyRead = text.length > 0 && !isFailure && looksEmptyResultText(text)
                const isTransient = isFailure && isTransientFailureText(text)
                // Brake on repeated UNPRODUCTIVE identical calls — permanent failures AND empty reads —
                // so the agent stops re-running the same find that keeps returning nothing (the Attio
                // thrash). Transient errors (429/5xx/timeout) are exempt: retrying those can succeed.
                if ((isFailure && !isTransient) || isEmptyRead) {
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

// Transient = worth retrying (rate limit, 5xx, timeout, dropped socket); these are exempt from the
// repeat-breaker so the agent isn't blocked from re-trying a call that can legitimately recover.
export function isTransientFailureText(text: string): boolean {
    return /\b(429|5\d\d)\b|rate.?limit|timeout|timed out|temporarily|try again|econnreset|etimedout|socket hang up|service unavailable/i.test(text)
}

// A "successful" but empty read — the result the agent kept re-fetching in the Attio thrash. Matched
// from the shapes our action results use (found:false, empty array) and the A3a empty-result note.
export function looksEmptyResultText(text: string): boolean {
    return /"found"\s*:\s*false|\bempty result\b|no results matched|"result"\s*:\s*\[\s*\]|"results"\s*:\s*\[\s*\]/i.test(text)
}

function runawayTokenCeiling(provider: AIProviderName): number {
    return aiProviderUtils.getMaxContextTokens({ provider }) * RUNAWAY_TURN_CONTEXT_MULTIPLE
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
    const candidate = [...baseMessages, ...chatAiUtils.collectStepMessages(steps)]
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
    onProgress?: (progress: { uiParts: PersistedChatPart[], responseMessages: ModelMessage[] }) => void
}

export type ChatTurnSlot = {
    provider: AIProviderName
    model: LanguageModel
    fastModel?: LanguageModel
    tools: ToolSet
}

export type RunChatTurnParams = {
    slots: ChatTurnSlot[]
    systemPrompt: string
    messages: ModelMessage[]
    tier: { id: string, thinkingBudget: number, modelId: string }
    phaseState: { phase: ChatPhase }
    abortSignal: AbortSignal
    log: ChatTurnLogger
    sinks?: ChatTurnSinks
    stopWhen?: StopCondition<ToolSet> | Array<StopCondition<ToolSet>>
}

type StreamFailureAction = 'retry_slot' | 'advance_slot' | 'stop'

export type ChatTurnResult = {
    accumulatedResponseMessages: ModelMessage[]
    uiParts: PersistedChatPart[]
    usage: LanguageModelUsage | undefined
    finishReason: string
    truncatedAfterRetries: boolean
    budgetExceeded: boolean
    streamError: Error | null
    continuations: number
    totalInputTokens: number
    totalOutputTokens: number
    toolCalls: ChatTurnToolCall[]
}
