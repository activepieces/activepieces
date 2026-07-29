import { AIProviderName } from '@activepieces/core-utils'
import { ModelMessage, SystemModelMessage } from 'ai'

/**
 * Lives here rather than beside the provider factory on purpose: `loop.ts` needs it, and
 * `model.ts` statically imports seven provider SDKs. Keeping this dependency-free is what lets
 * a host that supplies its own model (the engine) tree-shake those SDKs out of its bundle.
 */
export function buildSystemPromptWithCaching({ systemPrompt, provider }: {
    systemPrompt: string
    provider: AIProviderName
}): string | SystemModelMessage {
    switch (provider) {
        case AIProviderName.ANTHROPIC:
        case AIProviderName.BEDROCK:
            return { role: 'system', content: systemPrompt, providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } } }
        default:
            return systemPrompt
    }
}

export function hasVisibleContent(content: ContentPartLike[]): boolean {
    return content.some((part) => VISIBLE_PART_TYPES.has(part.type))
}

/**
 * Anthropic rejects a thinking block whose signature doesn't match the exact request that
 * produced it. Cross-turn history we reassemble can carry blocks from a different request,
 * so they are dropped before replay. In-flight thinking within one streamText call keeps its
 * intact signature and is untouched.
 */
export function stripThinkingBlocks(messages: ModelMessage[], _provider: AIProviderName): ModelMessage[] {
    const hasThinking = messages.some(
        (msg) => msg.role === 'assistant' && Array.isArray(msg.content)
            && (msg.content as Array<Record<string, unknown>>).some(
                (part) => part['type'] === 'reasoning' || part['type'] === 'thinking',
            ),
    )
    if (!hasThinking) return messages

    return messages
        .map((msg) => {
            if (msg.role !== 'assistant' || !Array.isArray(msg.content)) return msg
            const filtered = (msg.content as Array<Record<string, unknown>>).filter(
                (part) => part['type'] !== 'reasoning' && part['type'] !== 'thinking',
            )
            if (filtered.length === msg.content.length) return msg
            if (filtered.length === 0) return null
            return { ...msg, content: filtered }
        })
        .filter((msg): msg is ModelMessage => msg !== null)
}

export function sanitizeTruncatedAssistantTail(messages: ModelMessage[]): ModelMessage[] {
    const last = messages[messages.length - 1]
    if (!last || last.role !== 'assistant' || !Array.isArray(last.content)) {
        return messages
    }

    const resolvedToolCallIds = new Set(
        messages
            .flatMap((msg) => (msg.role === 'tool' && Array.isArray(msg.content) ? msg.content : []))
            .flatMap((part) => (part.type === 'tool-result' ? [part.toolCallId] : [])),
    )

    const sanitizedParts = last.content.filter((part) => {
        if (part.type === 'reasoning') {
            return false
        }
        if (part.type === 'tool-call') {
            return resolvedToolCallIds.has(part.toolCallId)
        }
        return true
    })

    const head = messages.slice(0, -1)
    if (sanitizedParts.length === 0) {
        return head
    }
    if (sanitizedParts.length === last.content.length) {
        return messages
    }
    return [...head, { ...last, content: sanitizedParts }]
}

/**
 * Each step's `response.messages` is CUMULATIVE — it already contains every prior step's
 * assistant/tool messages — so the last step holds the complete set. Flat-mapping all steps
 * would re-emit earlier steps in a 4,3,2,1 staircase.
 */
export function collectStepMessages(steps: Array<{ response: { messages: ModelMessage[] } }>): ModelMessage[] {
    return steps[steps.length - 1]?.response.messages ?? []
}

export function estimateTokenCount({ messages, extraLength = 0 }: { messages: ModelMessage[], extraLength?: number }): number {
    return Math.ceil((JSON.stringify(messages).length + extraLength) / CHARS_PER_TOKEN_ESTIMATE)
}

/**
 * A tool result's full payload is only needed while the model is acting on it; older
 * oversized results dilute the context and can overflow the window. Keeps the most recent
 * results intact and replaces older oversized ones with a short marker. Never removes a
 * message (keeps tool_use/tool_result pairing valid) and never mutates the input. Pure.
 *
 * `neverCollapseToolNames` pins discovered schemas: those results are the agent's memory of
 * an action's inputs, and collapsing them makes it re-discover or guess a schema it already
 * fetched. They don't consume a stale slot either.
 */
export function collapseStaleToolOutputs({ messages, neverCollapseToolNames = EMPTY_TOOL_NAMES, keepRecentToolResults = KEEP_RECENT_TOOL_RESULTS }: {
    messages: ModelMessage[]
    neverCollapseToolNames?: ReadonlySet<string>
    keepRecentToolResults?: number
}): ModelMessage[] {
    const totalToolResults = messages.reduce((count, message) => {
        if (message.role !== 'tool' || !Array.isArray(message.content)) return count
        return count + message.content.filter((part) => part.type === 'tool-result').length
    }, 0)

    const staleCount = totalToolResults - keepRecentToolResults
    if (staleCount <= 0) return messages

    let seen = 0
    return messages.map((message) => {
        if (message.role !== 'tool' || !Array.isArray(message.content)) return message
        const content = message.content.map((part) => {
            if (part.type !== 'tool-result') return part
            if (neverCollapseToolNames.has(part.toolName)) return part
            const isStale = seen++ < staleCount
            if (!isStale) return part
            const serialized = typeof part.output === 'string' ? part.output : JSON.stringify(part.output)
            if (serialized.length <= COLLAPSE_OUTPUT_OVER_CHARS) return part
            return {
                ...part,
                output: { type: 'text' as const, value: `[earlier ${part.toolName} result omitted to save context — it was used at the time]` },
            }
        })
        return { ...message, content }
    })
}

const EMPTY_TOOL_NAMES: ReadonlySet<string> = new Set()

const VISIBLE_PART_TYPES: ReadonlySet<string> = new Set(['text', 'reasoning', 'tool-call'])

export type ContentPartLike = {
    type: string
    text?: string
    toolCallId?: string
    toolName?: string
    input?: unknown
    args?: unknown
    output?: unknown
    sourceType?: string
    id?: string
    url?: string
    title?: string
    mediaType?: string
    filename?: string
}

const KEEP_RECENT_TOOL_RESULTS = 6

const COLLAPSE_OUTPUT_OVER_CHARS = 600

const CHARS_PER_TOKEN_ESTIMATE = 4
