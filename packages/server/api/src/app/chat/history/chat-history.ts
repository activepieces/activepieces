import { ChatHistoryMessage, ChatHistoryToolCall } from '@activepieces/shared'
import { ModelMessage } from 'ai'

function reconstructChatHistory(messages: ModelMessage[]): ChatHistoryMessage[] {
    const result: ChatHistoryMessage[] = []

    for (const msg of messages) {
        if (msg.role === 'user') {
            const textContent = extractTextFromContent(msg.content)
            if (textContent) {
                result.push({ role: 'user', content: textContent })
            }
        }
        else if (msg.role === 'assistant') {
            const parts = Array.isArray(msg.content) ? msg.content : [{ type: 'text' as const, text: String(msg.content) }]
            let text = ''
            const toolCalls: ChatHistoryToolCall[] = []

            for (const part of parts) {
                if (typeof part === 'string') {
                    text += part
                }
                else if (part.type === 'text') {
                    text += part.text
                }
                else if (part.type === 'tool-call') {
                    toolCalls.push({
                        toolCallId: part.toolCallId,
                        title: part.toolName,
                        status: 'completed',
                        input: typeof part.input === 'object' && part.input !== null ? part.input as Record<string, unknown> : undefined,
                    })
                }
            }

            if (text || toolCalls.length > 0) {
                result.push({
                    role: 'assistant',
                    content: text,
                    ...(toolCalls.length > 0 ? { toolCalls } : {}),
                })
            }
        }
        else if (msg.role === 'tool') {
            const lastAssistant = result[result.length - 1]
            if (lastAssistant?.role === 'assistant' && lastAssistant.toolCalls) {
                const toolResults = Array.isArray(msg.content) ? msg.content : []
                for (const toolResult of toolResults) {
                    if (typeof toolResult === 'object' && toolResult !== null && 'type' in toolResult && toolResult.type === 'tool-result') {
                        const tr = toolResult as { toolCallId: string, output: unknown }
                        const existing = lastAssistant.toolCalls.find((tc) => tc.toolCallId === tr.toolCallId)
                        if (existing) {
                            existing.output = typeof tr.output === 'string'
                                ? tr.output
                                : JSON.stringify(tr.output)
                            existing.status = 'completed'
                        }
                    }
                }
            }
        }
    }

    return result
}

function extractTextFromContent(content: unknown): string {
    if (typeof content === 'string') return content
    if (!Array.isArray(content)) return ''
    let text = ''
    for (const part of content) {
        if (typeof part === 'object' && part !== null && 'type' in part && part.type === 'text' && 'text' in part) {
            text += part.text
        }
    }
    return text
}

export const chatHistory = {
    reconstruct: reconstructChatHistory,
}
