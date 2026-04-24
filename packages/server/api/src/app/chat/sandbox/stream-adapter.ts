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

export function createStreamWriter({ writer, textPartId, reasoningPartId, onSessionTitle }: {
    writer: ChatWriter
    textPartId: string
    reasoningPartId: string
    onSessionTitle?: (title: string) => void
}): { write: (update: Record<string, unknown>) => void } {
    let textStarted = false
    let reasoningStarted = false

    return {
        write(update: Record<string, unknown>): void {
            const updateType = getString(update, 'sessionUpdate')

            switch (updateType) {
                case SandboxSessionUpdateType.AGENT_MESSAGE_CHUNK: {
                    const text = chatEventUtils.extractContentText(update)
                    if (text) {
                        if (!textStarted) {
                            writer.write({ type: 'text-start', id: textPartId })
                            textStarted = true
                        }
                        writer.write({ type: 'text-delta', id: textPartId, delta: text })
                    }
                    break
                }
                case SandboxSessionUpdateType.AGENT_THOUGHT_CHUNK: {
                    const text = chatEventUtils.extractContentText(update)
                    if (text) {
                        if (!reasoningStarted) {
                            writer.write({ type: 'reasoning-start', id: reasoningPartId })
                            reasoningStarted = true
                        }
                        writer.write({ type: 'reasoning-delta', id: reasoningPartId, delta: text })
                    }
                    break
                }
                case SandboxSessionUpdateType.TOOL_CALL: {
                    if (textStarted) {
                        writer.write({ type: 'text-end', id: textPartId })
                        textStarted = false
                    }
                    if (reasoningStarted) {
                        writer.write({ type: 'reasoning-end', id: reasoningPartId })
                        reasoningStarted = false
                    }
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
        },
    }
}

export function createHistoryReplayFilter(): {
    processUpdate: (update: Record<string, unknown>, write: (u: Record<string, unknown>) => void) => void
} {
    let state: 'detecting' | 'suppressing' | 'passthrough' = 'detecting'
    let textBuffer = ''
    let eventQueue: Array<Record<string, unknown>> = []

    return {
        processUpdate(update: Record<string, unknown>, write: (u: Record<string, unknown>) => void): void {
            if (state === 'passthrough') {
                write(update)
                return
            }

            const updateType = getString(update, 'sessionUpdate')
            const isTextChunk = updateType === SandboxSessionUpdateType.AGENT_MESSAGE_CHUNK

            if (state === 'detecting') {
                if (!isTextChunk) {
                    write(update)
                    return
                }
                eventQueue.push(update)
                const text = chatEventUtils.extractContentText(update)
                if (text) {
                    textBuffer += text
                    if (chatEventUtils.isHistoryReplayContent(textBuffer)) {
                        state = 'suppressing'
                        textBuffer = ''
                        eventQueue = []
                        return
                    }
                    if (textBuffer.length > 500) {
                        state = 'passthrough'
                        textBuffer = ''
                        const queued = eventQueue
                        eventQueue = []
                        for (const e of queued) {
                            write(e)
                        }
                        return
                    }
                }
                return
            }

            if (state === 'suppressing') {
                if (!isTextChunk) {
                    write(update)
                    return
                }
                const text = chatEventUtils.extractContentText(update)
                if (!text) return
                textBuffer += text
                if (chatEventUtils.isHistoryReplayContent(textBuffer)) {
                    textBuffer = ''
                    return
                }
                if (textBuffer.length > 200) {
                    state = 'passthrough'
                    textBuffer = ''
                    return
                }
            }
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
