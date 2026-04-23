import { isObject, isString } from '@activepieces/shared'
import { UIMessage, UIMessageStreamWriter } from 'ai'
import { chatEventUtils } from './ai-event-utils'
import { SandboxSessionUpdateType } from './sandbox-agent'

const MAX_TOOL_OUTPUT_SIZE = 64 * 1024

type ChatDataParts = {
    'session-title': { title: string }
    'plan': { entries: Array<{ content: string, status: string }> }
    'usage': { inputTokens: number, outputTokens: number }
}

type ChatUIMessage = UIMessage<unknown, ChatDataParts>
type ChatWriter = UIMessageStreamWriter<ChatUIMessage>

export function writeSandboxEventToStream({ update, writer, textPartId, reasoningPartId, onSessionTitle }: {
    update: Record<string, unknown>
    writer: ChatWriter
    textPartId: string
    reasoningPartId: string
    onSessionTitle?: (title: string) => void
}): void {
    const updateType = getString(update, 'sessionUpdate')

    switch (updateType) {
        case SandboxSessionUpdateType.AGENT_MESSAGE_CHUNK: {
            const text = chatEventUtils.extractContentText(update)
            if (text) {
                writer.write({ type: 'text-delta', id: textPartId, delta: text })
            }
            break
        }
        case SandboxSessionUpdateType.AGENT_THOUGHT_CHUNK: {
            const text = chatEventUtils.extractContentText(update)
            if (text) {
                writer.write({ type: 'reasoning-delta', id: reasoningPartId, delta: text })
            }
            break
        }
        case SandboxSessionUpdateType.TOOL_CALL: {
            const toolCallId = getString(update, 'toolCallId') ?? 'unknown'
            const title = getString(update, 'title') ?? 'Unknown tool'
            const rawInput = isObject(update.rawInput) ? update.rawInput : {}
            writer.write({
                type: 'tool-input-start',
                toolCallId,
                toolName: title,
                dynamic: true,
                title,
            })
            writer.write({
                type: 'tool-input-available',
                toolCallId,
                toolName: title,
                input: rawInput,
                dynamic: true,
                title,
            })
            break
        }
        case SandboxSessionUpdateType.TOOL_CALL_UPDATE: {
            const status = getString(update, 'status')
            if (status === 'completed') {
                const toolCallId = getString(update, 'toolCallId') ?? 'unknown'
                const rawOutput = truncateToolOutput(chatEventUtils.extractToolOutput(update))
                writer.write({
                    type: 'tool-output-available',
                    toolCallId,
                    output: rawOutput,
                    dynamic: true,
                })
            }
            break
        }
        case SandboxSessionUpdateType.SESSION_INFO_UPDATE: {
            const title = getString(update, 'title')
            if (title) {
                writer.write({ type: 'data-session-title', data: { title }, transient: true })
                onSessionTitle?.(title)
            }
            break
        }
        case SandboxSessionUpdateType.PLAN: {
            const entries = update.entries
            if (Array.isArray(entries)) {
                const planEntries = entries
                    .filter(isObject)
                    .map((entry) => ({
                        content: getString(entry, 'content') ?? '',
                        status: getString(entry, 'status') ?? 'pending',
                    }))
                writer.write({ type: 'data-plan', data: { entries: planEntries } })
            }
            break
        }
        case SandboxSessionUpdateType.USAGE_UPDATE: {
            const inputTokens = getNumber(update, 'inputTokens') ?? getNumber(update, 'used') ?? 0
            const outputTokens = getNumber(update, 'outputTokens') ?? 0
            writer.write({ type: 'data-usage', data: { inputTokens, outputTokens }, transient: true })
            break
        }
        default:
            break
    }
}

export function createHistoryReplayFilter(): { shouldSuppress: (update: Record<string, unknown>) => boolean } {
    let state: 'detecting' | 'suppressing' | 'passthrough' = 'detecting'
    let buffer = ''

    return {
        shouldSuppress(update: Record<string, unknown>): boolean {
            if (state === 'passthrough') return false

            const updateType = getString(update, 'sessionUpdate')
            if (updateType !== SandboxSessionUpdateType.AGENT_MESSAGE_CHUNK) return false

            const text = chatEventUtils.extractContentText(update)
            if (!text) return false

            if (state === 'detecting') {
                buffer += text
                if (chatEventUtils.isHistoryReplayContent(buffer)) {
                    state = 'suppressing'
                    buffer = ''
                    return true
                }
                if (buffer.length > 500) {
                    state = 'passthrough'
                    buffer = ''
                }
                return false
            }

            if (chatEventUtils.isHistoryReplayContent(text)) {
                return true
            }

            state = 'passthrough'
            return false
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

export type { ChatDataParts, ChatUIMessage }
