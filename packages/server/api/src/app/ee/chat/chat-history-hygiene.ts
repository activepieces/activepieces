import { ModelMessage } from 'ai'

const KEEP_RECENT_TOOL_RESULTS = 6
const COLLAPSE_OUTPUT_OVER_CHARS = 600

/**
 * Collapses stale large tool-result outputs in the LLM-facing history.
 *
 * A tool result's full payload is only needed on the turn it is produced; on
 * later turns it dilutes the context and buries the user's intent under walls
 * of machine JSON (research/props/explore/test outputs). This keeps the most
 * recent results intact and replaces older oversized ones with a short marker.
 *
 * Never removes a message (tool_use/tool_result pairing stays valid) and never
 * mutates the input — callers persist the full history separately.
 */
function collapseStaleToolOutputs({ messages }: { messages: ModelMessage[] }): ModelMessage[] {
    const totalToolResults = messages.reduce((count, message) => {
        if (message.role !== 'tool' || !Array.isArray(message.content)) return count
        return count + message.content.filter((part) => part.type === 'tool-result').length
    }, 0)

    const staleCount = totalToolResults - KEEP_RECENT_TOOL_RESULTS
    if (staleCount <= 0) return messages

    let seen = 0
    return messages.map((message) => {
        if (message.role !== 'tool' || !Array.isArray(message.content)) return message
        const content = message.content.map((part) => {
            if (part.type !== 'tool-result') return part
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

export const chatHistoryHygiene = {
    collapseStaleToolOutputs,
}
