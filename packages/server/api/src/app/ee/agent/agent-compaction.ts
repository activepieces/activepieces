import { readFileSync } from 'node:fs'
import path from 'node:path'
import { ActivepiecesError, AIProviderName, ErrorCode } from '@activepieces/core-utils'
import { agentAiUtils } from '@activepieces/server-utils'
import { aiProviderUtils } from '@activepieces/shared'
import { generateText, LanguageModel, ModelMessage } from 'ai'
import { FastifyBaseLogger } from 'fastify'

const COMPACTION_THRESHOLD = 0.7
const RECENT_WINDOW_RATIO = 0.3
const CHARS_PER_TOKEN_ESTIMATE = 4
const MIN_MESSAGES_BEFORE_COMPACTION = 6
const MAX_TOOL_RESULT_CHARS_FOR_SUMMARY = 2_000
const MAX_MESSAGE_CHARS_FOR_SUMMARY = 20_000

const COMPACTION_SYSTEM_PROMPT = readFileSync(
    path.resolve('packages/server/api/src/assets/prompts/chat-compaction-prompt.md'),
    'utf8',
)

function estimateTokenCount({ messages, systemPromptLength }: {
    messages: ModelMessage[]
    systemPromptLength: number
}): number {
    const totalChars = JSON.stringify(messages).length + systemPromptLength
    return Math.ceil(totalChars / CHARS_PER_TOKEN_ESTIMATE)
}

function contextBudget({ provider, reservedTokens }: { provider: AIProviderName, reservedTokens: number }): number {
    return Math.max(0, aiProviderUtils.getMaxContextTokens({ provider }) - reservedTokens)
}

function recentWindowSizeFor({ messages, targetTokens }: { messages: ModelMessage[], targetTokens: number }): number {
    let tokens = 0
    let size = 0
    for (let i = messages.length - 1; i > 0 && tokens < targetTokens; i--) {
        tokens += Math.ceil(JSON.stringify(messages[i]).length / CHARS_PER_TOKEN_ESTIMATE)
        size++
    }
    return Math.min(Math.max(2, size), messages.length - 1)
}

function shouldCompact({ estimatedTokens, provider, messageCount, reservedTokens }: {
    estimatedTokens: number
    provider: AIProviderName
    messageCount: number
    reservedTokens: number
}): boolean {
    if (messageCount < MIN_MESSAGES_BEFORE_COMPACTION) {
        return false
    }
    return estimatedTokens > contextBudget({ provider, reservedTokens }) * COMPACTION_THRESHOLD
}

/**
 * Anthropic requires that every tool_result has a preceding tool_use in the
 * same context, so the cutoff must not split an assistant→tool pair.
 */
function snapToSafeMessageBoundary({ messages, rawCutoff }: {
    messages: ModelMessage[]
    rawCutoff: number
}): number {
    let idx = Math.max(0, Math.min(rawCutoff, messages.length - 1))

    while (idx > 0 && messages[idx].role === 'tool') {
        idx--
    }

    return idx
}

async function compactMessages({ messages, existingSummary, summarizedUpToIndex, provider, reservedTokens, model, log }: {
    messages: ModelMessage[]
    existingSummary: string | null
    summarizedUpToIndex: number | null
    provider: AIProviderName
    reservedTokens: number
    model: LanguageModel
    log: FastifyBaseLogger
}): Promise<{ summary: string, summarizedUpToIndex: number }> {
    const recentWindowSize = recentWindowSizeFor({
        messages,
        targetTokens: contextBudget({ provider, reservedTokens }) * RECENT_WINDOW_RATIO,
    })
    const rawCutoff = messages.length - recentWindowSize
    const newCutoffIndex = snapToSafeMessageBoundary({ messages, rawCutoff })

    const startIndex = summarizedUpToIndex ?? 0
    if (newCutoffIndex <= startIndex) {
        return { summary: existingSummary ?? '', summarizedUpToIndex: startIndex }
    }
    const messagesToSummarize = messages.slice(startIndex, newCutoffIndex)

    let contentToSummarize = ''
    if (existingSummary) {
        contentToSummarize += `Previous conversation summary:\n${existingSummary}\n\nNew messages since last summary:\n`
    }

    for (const msg of messagesToSummarize) {
        const content = truncateForSummary({ output: extractTextContent(msg), limit: MAX_MESSAGE_CHARS_FOR_SUMMARY })
        if (content) {
            contentToSummarize += `[${msg.role}]: ${content}\n`
        }
    }

    log.info({
        totalMessages: messages.length,
        messagesToSummarize: messagesToSummarize.length,
        newCutoffIndex,
        recentWindowSize,
        hadExistingSummary: !!existingSummary,
    }, 'Compacting chat messages')

    const { text: summary } = await generateText({
        model,
        instructions: COMPACTION_SYSTEM_PROMPT,
        telemetry: agentAiUtils.buildTelemetry({ functionId: 'agent-compaction' }),
        prompt: contentToSummarize,
    })

    return { summary, summarizedUpToIndex: newCutoffIndex }
}

function buildCompactedPayload({ messages, summary, summarizedUpToIndex, provider, reservedTokens }: {
    messages: ModelMessage[]
    summary: string | null
    summarizedUpToIndex: number | null
    provider: AIProviderName
    reservedTokens: number
}): ModelMessage[] {
    if (!summary || summarizedUpToIndex === null) {
        return messages
    }

    const recentMessages = messages.slice(summarizedUpToIndex)
    const summaryText = `[Previous conversation summary]\n${summary}\n[End of summary — conversation continues below]`

    const budget = contextBudget({ provider, reservedTokens })
    const threshold = budget * COMPACTION_THRESHOLD
    const summaryCharLen = JSON.stringify(summaryText).length
    const recentLengths = recentMessages.map((m) => JSON.stringify(m).length)

    let runningCharLen = summaryCharLen + recentLengths.reduce((a, b) => a + b, 0)
    let startIdx = 0

    while (
        startIdx < recentMessages.length - 1
        && (Math.ceil(runningCharLen / CHARS_PER_TOKEN_ESTIMATE) > threshold || recentMessages[startIdx].role === 'tool')
    ) {
        runningCharLen -= recentLengths[startIdx]
        startIdx++
    }

    const trimmedRecent = recentMessages.slice(startIdx)

    // Anthropic rejects consecutive same-role messages, so merge the summary
    // into the first message when it is already a 'user' turn.
    const finalPayload: ModelMessage[] = trimmedRecent[0]?.role === 'user'
        ? [
            {
                ...trimmedRecent[0],
                content: typeof trimmedRecent[0].content === 'string'
                    ? `${summaryText}\n\n${trimmedRecent[0].content}`
                    : [{ type: 'text' as const, text: summaryText }, ...trimmedRecent[0].content],
            },
            ...trimmedRecent.slice(1),
        ]
        : [{ role: 'user', content: summaryText }, ...trimmedRecent]
    const finalEstimate = Math.ceil(runningCharLen / CHARS_PER_TOKEN_ESTIMATE)

    if (finalEstimate > budget) {
        throw new ActivepiecesError({
            code: ErrorCode.CHAT_CONTEXT_LIMIT_EXCEEDED,
            params: {},
        })
    }

    return finalPayload
}

function truncateForSummary({ output, limit }: { output: string, limit: number }): string {
    const codePoints = [...output]
    if (codePoints.length <= limit) return output
    return `${codePoints.slice(0, limit).join('')}…[truncated ${codePoints.length - limit} chars]`
}

function extractTextContent(message: ModelMessage): string {
    if (typeof message.content === 'string') return message.content
    if (!Array.isArray(message.content)) return ''
    let text = ''
    for (const part of message.content) {
        if (typeof part === 'string') {
            text += part
        }
        else if (typeof part === 'object' && part !== null && 'type' in part) {
            if (part.type === 'text' && 'text' in part) {
                text += String(part.text)
            }
            else if (part.type === 'tool-call' && 'toolName' in part) {
                text += `[Tool call: ${String(part.toolName)}]`
            }
            else if (part.type === 'tool-result' && 'output' in part) {
                const output = typeof part.output === 'string' ? part.output : JSON.stringify(part.output)
                text += `[Tool result: ${truncateForSummary({ output, limit: MAX_TOOL_RESULT_CHARS_FOR_SUMMARY })}]`
            }
        }
    }
    return text
}

export const agentCompaction = {
    estimateTokenCount,
    shouldCompact,
    compactMessages,
    buildCompactedPayload,
}
