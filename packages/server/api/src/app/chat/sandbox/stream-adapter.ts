import { isObject, isString } from '@activepieces/shared'
import { UIMessage, UIMessageStreamWriter } from 'ai'
import { chatEventUtils } from './ai-event-utils'
import { SandboxSessionUpdateType } from './sandbox-agent'

export function createStreamWriter({ writer, textPartId, reasoningPartId, onSessionTitle }: {
    writer: ChatWriter
    textPartId: string
    reasoningPartId: string
    onSessionTitle?: (title: string) => void
}): { write: (update: Record<string, unknown>) => void } {
    const text = chunkedPart({ writer, id: textPartId, kind: 'text' })
    const reasoning = chunkedPart({ writer, id: reasoningPartId, kind: 'reasoning' })

    return {
        write(update: Record<string, unknown>): void {
            switch (getString(update, 'sessionUpdate')) {
                case SandboxSessionUpdateType.AGENT_MESSAGE_CHUNK:
                    text.append(chatEventUtils.extractContentText(update))
                    break
                case SandboxSessionUpdateType.AGENT_THOUGHT_CHUNK:
                    reasoning.append(chatEventUtils.extractContentText(update))
                    break
                case SandboxSessionUpdateType.TOOL_CALL: {
                    text.end()
                    reasoning.end()
                    const toolCallId = getString(update, 'toolCallId') ?? 'unknown'
                    const title = getString(update, 'title') ?? 'Unknown tool'
                    const input = isObject(update.rawInput) ? update.rawInput : {}
                    writer.write({ type: 'tool-input-start', toolCallId, toolName: title, dynamic: true, title })
                    writer.write({ type: 'tool-input-available', toolCallId, toolName: title, input, dynamic: true, title })
                    break
                }
                case SandboxSessionUpdateType.TOOL_CALL_UPDATE: {
                    if (getString(update, 'status') !== 'completed') break
                    writer.write({
                        type: 'tool-output-available',
                        toolCallId: getString(update, 'toolCallId') ?? 'unknown',
                        output: truncateToolOutput(chatEventUtils.extractToolOutput(update)),
                        dynamic: true,
                    })
                    break
                }
                case SandboxSessionUpdateType.SESSION_INFO_UPDATE: {
                    const title = getString(update, 'title')
                    if (!title) break
                    writer.write({ type: 'data-session-title', data: { title }, transient: true })
                    onSessionTitle?.(title)
                    break
                }
                case SandboxSessionUpdateType.PLAN: {
                    const entries = update.entries
                    if (!Array.isArray(entries)) break
                    writer.write({
                        type: 'data-plan',
                        data: {
                            entries: entries.filter(isObject).map((entry) => ({
                                content: getString(entry, 'content') ?? '',
                                status: getString(entry, 'status') ?? 'pending',
                            })),
                        },
                    })
                    break
                }
                case SandboxSessionUpdateType.USAGE_UPDATE:
                    writer.write({
                        type: 'data-usage',
                        data: {
                            inputTokens: getNumber(update, 'inputTokens') ?? getNumber(update, 'used') ?? 0,
                            outputTokens: getNumber(update, 'outputTokens') ?? 0,
                        },
                        transient: true,
                    })
                    break
                default:
                    break
            }
        },
    }
}

export function createHistoryReplayFilter(): { shouldSuppress: (update: Record<string, unknown>) => boolean } {
    let state: 'detecting' | 'suppressing' | 'passthrough' = 'detecting'
    let buffer = ''

    return {
        shouldSuppress(update: Record<string, unknown>): boolean {
            if (state === 'passthrough') return false
            const isTextChunk = getString(update, 'sessionUpdate') === SandboxSessionUpdateType.AGENT_MESSAGE_CHUNK
            if (state === 'suppressing' && !isTextChunk) return false
            if (!isTextChunk) return false

            const text = chatEventUtils.extractContentText(update)
            if (!text) return state === 'suppressing'
            buffer += text
            if (chatEventUtils.isHistoryReplayContent(buffer)) {
                buffer = ''
                state = 'suppressing'
                return true
            }
            const limit = state === 'suppressing' ? SUPPRESSION_BUFFER_LIMIT : DETECTION_BUFFER_LIMIT
            if (buffer.length > limit) {
                buffer = ''
                state = 'passthrough'
                return false
            }
            return state === 'suppressing'
        },
    }
}

function chunkedPart({ writer, id, kind }: { writer: ChatWriter, id: string, kind: 'text' | 'reasoning' }): {
    append: (delta: string | undefined) => void
    end: () => void
} {
    let started = false
    return {
        append(delta: string | undefined): void {
            if (!delta) return
            if (!started) {
                writer.write({ type: `${kind}-start`, id })
                started = true
            }
            writer.write({ type: `${kind}-delta`, id, delta })
        },
        end(): void {
            if (!started) return
            writer.write({ type: `${kind}-end`, id })
            started = false
        },
    }
}

function getString(obj: Record<string, unknown>, key: string): string | undefined {
    const value = obj[key]
    return isString(value) ? value : undefined
}

function getNumber(obj: Record<string, unknown>, key: string): number | undefined {
    const value = obj[key]
    return typeof value === 'number' ? value : undefined
}

function truncateToolOutput(output: string | undefined): string | undefined {
    if (output && output.length > MAX_TOOL_OUTPUT_SIZE) {
        return output.slice(0, MAX_TOOL_OUTPUT_SIZE) + '... (truncated)'
    }
    return output
}

const MAX_TOOL_OUTPUT_SIZE = 64 * 1024
const SUPPRESSION_BUFFER_LIMIT = 200
const DETECTION_BUFFER_LIMIT = 500

export type ChatDataParts = {
    'session-title': { title: string }
    'plan': { entries: Array<{ content: string, status: string }> }
    'usage': { inputTokens: number, outputTokens: number }
}

export type ChatUIMessage = UIMessage<unknown, ChatDataParts>
type ChatWriter = UIMessageStreamWriter<ChatUIMessage>
