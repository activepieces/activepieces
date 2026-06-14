import { chatAiUtils, ContentPartLike } from '@activepieces/server-utils'
import { AIProviderName, ChatPhase, chatToolPhases, PersistedChatPart, tryCatch } from '@activepieces/shared'
import { generateText, isLoopFinished, LanguageModel, LanguageModelUsage, ModelMessage, streamText, ToolSet } from 'ai'

const MAX_RESPONSE_OUTPUT_TOKENS = 32_000
const MAX_AUTO_CONTINUATIONS = 3
const MAX_EMPTY_CONTINUATIONS = 2
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

export async function runChatTurn({ model, provider, systemPrompt, messages, tools, allToolNames, tier, phaseState, abortSignal, log, sinks }: RunChatTurnParams): Promise<ChatTurnResult> {
    const drainStream = sinks?.drainStream ?? (async () => {})
    const onProgress = sinks?.onProgress ?? (() => {})

    const uiParts: PersistedChatPart[] = []
    const toolCalls: ChatTurnToolCall[] = []
    let toolCallOrder = 0
    let abortedStepMessages: ModelMessage[] = []
    let streamError: Error | null = null

    let llmMessages = messages
    const accumulatedResponseMessages: ModelMessage[] = []
    let continuations = 0
    let emptyContinuations = 0
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
        tools,
        providerOptions: chatAiUtils.buildProviderOptions({ provider, tier }),
        stopWhen: isLoopFinished(),
        prepareStep: ({ steps }) => {
            const lastStep = steps[steps.length - 1]
            const widened = lastStep?.toolCalls?.some((c) => chatToolPhases.isBuildOnlyTool(c.toolName))
            if (widened) {
                phaseState.phase = 'build'
            }
            return { activeTools: chatToolPhases.activeToolsForPhase({ phase: phaseState.phase, allToolNames }) }
        },
        experimental_repairToolCall: async ({ toolCall, error }) => {
            log.warn({ toolName: toolCall.toolName, err: error }, 'Repairing malformed tool call')
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
            if (result.success) {
                log.info({ toolName: result.toolCall.toolName, durationMs: result.durationMs }, 'Tool call completed')
            }
            else {
                log.warn({ toolName: result.toolCall.toolName, durationMs: result.durationMs, err: result.error }, 'Tool call failed')
            }
        },
        onAbort: ({ steps }) => {
            abortedStepMessages = chatAiUtils.collectStepMessages(steps)
        },
        onStepFinish: ({ content }) => {
            uiParts.push(...chatAiUtils.buildStepParts({ content: content as ContentPartLike[] }))
            onProgress([...uiParts])
        },
        onError: ({ error }) => {
            log.error({ err: error }, 'Chat streamText error')
            streamError = error instanceof Error ? error : new Error(String(error))
        },
    })

    for (;;) {
        const uiPartsCountBefore = uiParts.length
        const result = runStreamAttempt(llmMessages)
        await drainStream(result)
        if (abortSignal.aborted || streamError) break

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

        const producedVisibleOutput = uiParts.length > uiPartsCountBefore
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
        aborted: abortSignal.aborted,
        streamError,
        continuations,
        emptyContinuations,
        totalInputTokens,
        totalOutputTokens,
        toolCalls,
    }
}

type LoopDecision = 'finish' | 'continue_truncation' | 'continue_empty'

type ChatTurnLogger = {
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
}

export type ChatTurnResult = {
    accumulatedResponseMessages: ModelMessage[]
    abortedStepMessages: ModelMessage[]
    uiParts: PersistedChatPart[]
    usage: LanguageModelUsage | undefined
    finishReason: string
    truncatedAfterRetries: boolean
    aborted: boolean
    streamError: Error | null
    continuations: number
    emptyContinuations: number
    totalInputTokens: number
    totalOutputTokens: number
    toolCalls: ChatTurnToolCall[]
}
