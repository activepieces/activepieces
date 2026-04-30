import { readFileSync } from 'node:fs'
import path from 'node:path'
import { ActivepiecesError, AIProviderName, aiProviderUtils, ErrorCode } from '@activepieces/shared'
import { generateText, LanguageModel, ModelMessage } from 'ai'
import { FastifyBaseLogger } from 'fastify'

const COMPACTION_THRESHOLD = 0.7
const RECENT_WINDOW_RATIO = 0.3
const CHARS_PER_TOKEN_ESTIMATE = 4
const MIN_MESSAGES_BEFORE_COMPACTION = 6
const ESTIMATED_TOKENS_PER_MESSAGE = 200

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

function shouldCompact({ estimatedTokens, provider, messageCount }: {
    estimatedTokens: number
    provider: AIProviderName
    messageCount: number
}): boolean {
    if (messageCount < MIN_MESSAGES_BEFORE_COMPACTION) {
        return false
    }
    const maxContext = aiProviderUtils.getMaxContextTokens({ provider })
    return estimatedTokens > maxContext * COMPACTION_THRESHOLD
}

/**
 * Snaps a cutoff index forward to a safe message boundary.
 * Anthropic requires that every tool_result has a preceding tool_use in the
 * same context. If the cutoff lands on a 'tool' message (or inside an
 * assistant→tool pair), we back up so the recent window starts at the
 * assistant message that initiated the tool call.
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

async function compactMessages({ messages, existingSummary, summarizedUpToIndex, provider, model, log }: {
    messages: ModelMessage[]
    existingSummary: string | null
    summarizedUpToIndex: number | null
    provider: AIProviderName
    model: LanguageModel
    log: FastifyBaseLogger
}): Promise<{ summary: string, summarizedUpToIndex: number }> {
    const maxContext = aiProviderUtils.getMaxContextTokens({ provider })
    const targetRecentTokens = maxContext * RECENT_WINDOW_RATIO
    const recentWindowSize = Math.min(
        Math.max(2, Math.floor(targetRecentTokens / ESTIMATED_TOKENS_PER_MESSAGE)),
        messages.length - 1,
    )
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
        const content = extractTextContent(msg)
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
        system: COMPACTION_SYSTEM_PROMPT,
        prompt: contentToSummarize,
    })

    return { summary, summarizedUpToIndex: newCutoffIndex }
}

function buildCompactedPayload({ messages, summary, summarizedUpToIndex, provider }: {
    messages: ModelMessage[]
    summary: string | null
    summarizedUpToIndex: number | null
    provider: AIProviderName
}): ModelMessage[] {
    if (!summary || summarizedUpToIndex === null) {
        return messages
    }

    const recentMessages = messages.slice(summarizedUpToIndex)
    const summaryMessage: ModelMessage = {
        role: 'user',
        content: `[Previous conversation summary]\n${summary}\n[End of summary — conversation continues below]`,
    }

    const maxContext = aiProviderUtils.getMaxContextTokens({ provider })
    const threshold = maxContext * COMPACTION_THRESHOLD
    const summaryCharLen = JSON.stringify(summaryMessage).length
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
    const finalPayload = [summaryMessage, ...trimmedRecent]
    const finalEstimate = Math.ceil(runningCharLen / CHARS_PER_TOKEN_ESTIMATE)

    if (finalEstimate > maxContext) {
        throw new ActivepiecesError({
            code: ErrorCode.CHAT_CONTEXT_LIMIT_EXCEEDED,
            params: {},
        })
    }

    return finalPayload
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
                text += `[Tool result: ${output.slice(0, 500)}]`
            }
        }
    }
    return text
}

export const chatCompaction = {
    estimateTokenCount,
    shouldCompact,
    compactMessages,
    buildCompactedPayload,
}
