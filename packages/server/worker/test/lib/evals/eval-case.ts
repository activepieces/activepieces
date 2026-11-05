import { isNil } from '@activepieces/core-utils'
import { agentToolSkills } from '@activepieces/shared'
import { AssistantModelMessage, ModelMessage, ToolModelMessage } from 'ai'
import { z } from 'zod'

function fromDatasetItem(item: DatasetItem): EvalCase {
    const messages = tracedMessages(item.input)
    const userIndex = messages.findLastIndex((message) => message.role === 'user' && textOf(message).length > 0)
    if (userIndex === -1) {
        throw new Error(`Dataset item ${item.id} has no user message to replay`)
    }
    const toolNamesById = toolNamesByCallId(messages)
    return {
        id: item.id,
        caseNumber: item.metadata.case,
        problemType: item.metadata.problem_type,
        codeCheck: item.metadata.code_check,
        checks: item.expected_output.checks,
        sourceTraceId: item.source_trace_id,
        history: messages.slice(0, userIndex).flatMap((message) => toModelMessages({ message, toolNamesById })),
        userMessage: textOf(messages[userIndex]),
        recordedToolCalls: recordedCalls({ messages: messages.slice(userIndex + 1), toolNamesById }),
    }
}

function tracedMessages(input: unknown): TracedMessage[] {
    const decoded = typeof input === 'string' ? JSON.parse(input) : input
    return TracedMessages.parse(decoded)
}

function textOf(message: TracedMessage): string {
    return message.parts.flatMap((part) => part.type === 'text' ? [part.content] : []).join('\n\n').trim()
}

function toolNamesByCallId(messages: TracedMessage[]): Map<string, string> {
    return new Map(messages.flatMap((message) => message.parts.flatMap((part) => part.type === 'tool_call' ? [[part.id, part.name] as const] : [])))
}

function toModelMessages({ message, toolNamesById }: { message: TracedMessage, toolNamesById: Map<string, string> }): ModelMessage[] {
    if (message.role === 'user') {
        const text = textOf(message)
        return text.length === 0 ? [] : [{ role: 'user', content: text }]
    }
    if (message.role === 'assistant') {
        const content: AssistantModelMessage['content'] = message.parts.flatMap((part) => {
            if (part.type === 'text' && part.content.length > 0) {
                return [{ type: 'text' as const, text: part.content }]
            }
            if (part.type === 'tool_call') {
                return [{ type: 'tool-call' as const, toolCallId: part.id, toolName: part.name, input: part.arguments }]
            }
            return []
        })
        return content.length === 0 ? [] : [{ role: 'assistant', content }]
    }
    if (message.role === 'tool') {
        const content: ToolModelMessage['content'] = message.parts.flatMap((part) => part.type === 'tool_call_response'
            ? [{ type: 'tool-result' as const, toolCallId: part.id, toolName: toolNamesById.get(part.id) ?? 'unknown', output: { type: 'text' as const, value: asText(part.response) } }]
            : [])
        return content.length === 0 ? [] : [{ role: 'tool', content }]
    }
    return []
}

function recordedCalls({ messages, toolNamesById }: { messages: TracedMessage[], toolNamesById: Map<string, string> }): RecordedToolCall[] {
    const argumentsById = new Map(messages.flatMap((message) => message.parts.flatMap((part) => part.type === 'tool_call' ? [[part.id, part.arguments] as const] : [])))
    return messages.flatMap((message) => message.parts.flatMap((part) => {
        if (part.type !== 'tool_call_response' || wasRejected(part.response)) {
            return []
        }
        const wireName = toolNamesById.get(part.id)
        if (isNil(wireName)) {
            return []
        }
        const { toolName } = agentToolSkills.effectiveToolCall({ toolName: wireName, input: argumentsById.get(part.id) })
        return [{ toolName, output: part.response }]
    }))
}

function wasRejected(response: unknown): boolean {
    return typeof response === 'string' && REJECTED_PATTERN.test(response)
}

function asText(value: unknown): string {
    return typeof value === 'string' ? value : JSON.stringify(value)
}

const REJECTED_PATTERN = /^AI_[A-Za-z]+Error|There is no tool named/

const TracedPart = z.discriminatedUnion('type', [
    z.object({ type: z.literal('text'), content: z.string() }),
    z.object({ type: z.literal('tool_call'), id: z.string(), name: z.string(), arguments: z.unknown() }),
    z.object({ type: z.literal('tool_call_response'), id: z.string(), response: z.unknown() }),
])

const TracedMessage = z.object({
    role: z.string(),
    parts: z.array(z.unknown()).transform((parts) => parts.flatMap((part) => {
        const parsed = TracedPart.safeParse(part)
        return parsed.success ? [parsed.data] : []
    })),
})

const TracedMessages = z.array(TracedMessage)

export const DatasetItem = z.object({
    id: z.string(),
    input: z.unknown(),
    expected_output: z.object({
        checks: z.array(z.string()).min(1),
        problem_type: z.string(),
    }),
    metadata: z.object({
        case: z.number(),
        problem_type: z.string(),
        code_check: z.string(),
    }),
    source_trace_id: z.string().nullable(),
})

export const evalCase = {
    fromDatasetItem,
}

export type DatasetItem = z.infer<typeof DatasetItem>

type TracedMessage = z.infer<typeof TracedMessage>

export type RecordedToolCall = {
    toolName: string
    output: unknown
}

export type EvalCase = {
    id: string
    caseNumber: number
    problemType: string
    codeCheck: string
    checks: string[]
    sourceTraceId: string | null
    history: ModelMessage[]
    userMessage: string
    recordedToolCalls: RecordedToolCall[]
}
