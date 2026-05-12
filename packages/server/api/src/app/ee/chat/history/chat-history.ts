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
            let thoughts = ''
            const toolCalls: ChatHistoryToolCall[] = []

            for (const part of parts) {
                const p = part as unknown as Record<string, unknown>
                if (typeof part === 'string') {
                    text += part
                }
                else if (p.type === 'text' && typeof p.text === 'string') {
                    text += p.text
                }
                else if (p.type === 'tool-call') {
                    toolCalls.push({
                        toolCallId: p.toolCallId as string,
                        title: p.toolName as string,
                        status: 'completed',
                        input: typeof p.input === 'object' && p.input !== null ? p.input as Record<string, unknown> : undefined,
                    })
                }
                else if ((p.type === 'reasoning' || p.type === 'thinking') && typeof p.text === 'string') {
                    thoughts += p.text
                }
            }

            if (text || toolCalls.length > 0 || thoughts) {
                const lastResult = result[result.length - 1]
                if (lastResult?.role === 'assistant') {
                    // Merge consecutive assistant messages (agentic loop steps)
                    // into a single ChatHistoryMessage to match streaming behavior
                    if (text) {
                        lastResult.content = lastResult.content
                            ? lastResult.content + '\n' + text
                            : text
                    }
                    if (toolCalls.length > 0) {
                        lastResult.toolCalls = [...(lastResult.toolCalls ?? []), ...toolCalls]
                    }
                    if (thoughts) {
                        lastResult.thoughts = lastResult.thoughts
                            ? lastResult.thoughts + '\n' + thoughts
                            : thoughts
                    }
                }
                else {
                    result.push({
                        role: 'assistant',
                        content: text,
                        ...(toolCalls.length > 0 ? { toolCalls } : {}),
                        ...(thoughts.length > 0 ? { thoughts } : {}),
                    })
                }
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
