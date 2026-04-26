import { describe, expect, it, vi } from 'vitest'
import { SandboxSessionUpdateType } from '../../../../src/app/chat/sandbox/sandbox-agent'
import {
    createHistoryReplayFilter,
    createStreamWriter,
} from '../../../../src/app/chat/sandbox/stream-adapter'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTextChunk(text: string): Record<string, unknown> {
    return {
        sessionUpdate: SandboxSessionUpdateType.AGENT_MESSAGE_CHUNK,
        content: { type: 'text', text },
    }
}

function makeThoughtChunk(text: string): Record<string, unknown> {
    return {
        sessionUpdate: SandboxSessionUpdateType.AGENT_THOUGHT_CHUNK,
        content: { type: 'text', text },
    }
}

function makeToolCall(toolCallId = 'tc-1', title = 'My Tool', rawInput: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        sessionUpdate: SandboxSessionUpdateType.TOOL_CALL,
        toolCallId,
        title,
        rawInput,
    }
}

function makeToolCallUpdate(toolCallId = 'tc-1', status = 'completed', rawOutput?: string): Record<string, unknown> {
    return {
        sessionUpdate: SandboxSessionUpdateType.TOOL_CALL_UPDATE,
        toolCallId,
        status,
        ...(rawOutput !== undefined ? { rawOutput } : {}),
    }
}

function makeSessionInfoUpdate(title: string): Record<string, unknown> {
    return {
        sessionUpdate: SandboxSessionUpdateType.SESSION_INFO_UPDATE,
        title,
    }
}

function makePlan(entries: Array<{ content: string, status: string }>): Record<string, unknown> {
    return {
        sessionUpdate: SandboxSessionUpdateType.PLAN,
        entries,
    }
}

function makeUsageUpdate(inputTokens: number, outputTokens: number): Record<string, unknown> {
    return {
        sessionUpdate: SandboxSessionUpdateType.USAGE_UPDATE,
        inputTokens,
        outputTokens,
    }
}

function makeHistoryReplayText(): string {
    return '{"jsonrpc":"2.0","method":"session/update"}'
}

type MockWriter = {
    writer: Parameters<typeof createStreamWriter>[0]['writer']
    writes: unknown[]
}

function makeMockWriter(): MockWriter {
    const writes: unknown[] = []
    return {
        writer: {
            write: (item: unknown) => {
                writes.push(item)
            },
        } as unknown as Parameters<typeof createStreamWriter>[0]['writer'],
        writes,
    }
}

// ---------------------------------------------------------------------------
// createHistoryReplayFilter
// ---------------------------------------------------------------------------

describe('createHistoryReplayFilter', () => {
    it('does not suppress normal text chunks in detecting state', () => {
        const filter = createHistoryReplayFilter()
        const update = makeTextChunk('Hello world')
        expect(filter.shouldSuppress(update)).toBe(false)
    })

    it('transitions to suppressing and returns true when replay content is detected', () => {
        const filter = createHistoryReplayFilter()
        const replayText = makeHistoryReplayText()
        const update = makeTextChunk(replayText)
        expect(filter.shouldSuppress(update)).toBe(true)
    })

    it('continues suppressing subsequent text chunks that are replay content', () => {
        const filter = createHistoryReplayFilter()
        filter.shouldSuppress(makeTextChunk(makeHistoryReplayText()))

        const nextReplayChunk = makeTextChunk('{"jsonrpc":"2.0","method":"session/update"}')
        expect(filter.shouldSuppress(nextReplayChunk)).toBe(true)
    })

    it('suppresses non-text-chunk events while in suppressing state', () => {
        const filter = createHistoryReplayFilter()
        filter.shouldSuppress(makeTextChunk(makeHistoryReplayText()))

        const toolCallUpdate = makeToolCallUpdate()
        expect(filter.shouldSuppress(toolCallUpdate)).toBe(true)
    })

    it('transitions from suppressing to passthrough when buffer overflows (non-replay text)', () => {
        const filter = createHistoryReplayFilter()
        // Trigger suppressing state
        filter.shouldSuppress(makeTextChunk(makeHistoryReplayText()))

        // Push non-replay text that overflows the SUPPRESSION_BUFFER_LIMIT (200 chars)
        const longNonReplayText = 'x'.repeat(210)
        const result = filter.shouldSuppress(makeTextChunk(longNonReplayText))
        expect(result).toBe(false)
    })

    it('after passthrough state is reached, all events pass through regardless of content', () => {
        const filter = createHistoryReplayFilter()
        // Trigger suppressing then passthrough
        filter.shouldSuppress(makeTextChunk(makeHistoryReplayText()))
        filter.shouldSuppress(makeTextChunk('x'.repeat(210)))

        // Now even replay content should pass through
        expect(filter.shouldSuppress(makeTextChunk(makeHistoryReplayText()))).toBe(false)
        expect(filter.shouldSuppress(makeToolCallUpdate())).toBe(false)
    })

    it('transitions to passthrough in detecting state when non-replay buffer exceeds DETECTION_BUFFER_LIMIT (500)', () => {
        const filter = createHistoryReplayFilter()
        // Push a large non-replay text chunk in detecting state to overflow detection buffer
        const longText = 'a'.repeat(510)
        // This should not suppress (no replay content found) and transition to passthrough
        expect(filter.shouldSuppress(makeTextChunk(longText))).toBe(false)
        // Subsequent replay content should also pass through
        expect(filter.shouldSuppress(makeTextChunk(makeHistoryReplayText()))).toBe(false)
    })

    it('does not suppress non-text-chunk events while in detecting state', () => {
        const filter = createHistoryReplayFilter()
        const toolCall = makeToolCall()
        expect(filter.shouldSuppress(toolCall)).toBe(false)
    })

    it('handles incremental accumulation: detects replay across multiple small chunks', () => {
        const filter = createHistoryReplayFilter()
        // Send partial replay text that individually wouldn't trigger, but together they do
        expect(filter.shouldSuppress(makeTextChunk('"jsonrpc"'))).toBe(false)
        expect(filter.shouldSuppress(makeTextChunk('"session/update"'))).toBe(true)
    })

    it('suppresses replay text in suppressing state that matches replay markers', () => {
        const filter = createHistoryReplayFilter()
        filter.shouldSuppress(makeTextChunk(makeHistoryReplayText()))

        // Text containing replay markers stays suppressed
        const replayChunk = makeTextChunk('[history truncated]')
        expect(filter.shouldSuppress(replayChunk)).toBe(true)
    })
})

// ---------------------------------------------------------------------------
// createStreamWriter
// ---------------------------------------------------------------------------

describe('createStreamWriter', () => {
    it('emits text-start then text-delta for the first AGENT_MESSAGE_CHUNK', () => {
        const { writer, writes } = makeMockWriter()
        const sw = createStreamWriter({ writer, textPartId: 'txt-1', reasoningPartId: 'rsn-1' })

        sw.write(makeTextChunk('Hello'))

        expect(writes).toEqual([
            { type: 'text-start', id: 'txt-1' },
            { type: 'text-delta', id: 'txt-1', delta: 'Hello' },
        ])
    })

    it('emits only text-delta (no repeated text-start) for subsequent AGENT_MESSAGE_CHUNKs', () => {
        const { writer, writes } = makeMockWriter()
        const sw = createStreamWriter({ writer, textPartId: 'txt-1', reasoningPartId: 'rsn-1' })

        sw.write(makeTextChunk('Hello'))
        sw.write(makeTextChunk(' World'))

        const textStarts = writes.filter((w) => (w as { type: string }).type === 'text-start')
        expect(textStarts).toHaveLength(1)
        expect(writes[2]).toEqual({ type: 'text-delta', id: 'txt-1', delta: ' World' })
    })

    it('emits reasoning-start then reasoning-delta for the first AGENT_THOUGHT_CHUNK', () => {
        const { writer, writes } = makeMockWriter()
        const sw = createStreamWriter({ writer, textPartId: 'txt-1', reasoningPartId: 'rsn-1' })

        sw.write(makeThoughtChunk('Thinking...'))

        expect(writes).toEqual([
            { type: 'reasoning-start', id: 'rsn-1' },
            { type: 'reasoning-delta', id: 'rsn-1', delta: 'Thinking...' },
        ])
    })

    it('does not emit text-start/delta when AGENT_MESSAGE_CHUNK has no extractable text', () => {
        const { writer, writes } = makeMockWriter()
        const sw = createStreamWriter({ writer, textPartId: 'txt-1', reasoningPartId: 'rsn-1' })

        sw.write({ sessionUpdate: SandboxSessionUpdateType.AGENT_MESSAGE_CHUNK, content: { type: 'image' } })

        expect(writes).toHaveLength(0)
    })

    it('TOOL_CALL closes open text part and emits tool-input-start + tool-input-available', () => {
        const { writer, writes } = makeMockWriter()
        const sw = createStreamWriter({ writer, textPartId: 'txt-1', reasoningPartId: 'rsn-1' })

        sw.write(makeTextChunk('Some text'))
        sw.write(makeToolCall('tc-1', 'Search', { query: 'test' }))

        const types = writes.map((w) => (w as { type: string }).type)
        expect(types).toContain('text-end')
        expect(types).toContain('tool-input-start')
        expect(types).toContain('tool-input-available')
    })

    it('TOOL_CALL closes open reasoning part', () => {
        const { writer, writes } = makeMockWriter()
        const sw = createStreamWriter({ writer, textPartId: 'txt-1', reasoningPartId: 'rsn-1' })

        sw.write(makeThoughtChunk('reasoning'))
        sw.write(makeToolCall('tc-1', 'Tool'))

        const types = writes.map((w) => (w as { type: string }).type)
        expect(types).toContain('reasoning-end')
        expect(types).toContain('tool-input-start')
    })

    it('TOOL_CALL does not emit text-end when text was never started', () => {
        const { writer, writes } = makeMockWriter()
        const sw = createStreamWriter({ writer, textPartId: 'txt-1', reasoningPartId: 'rsn-1' })

        sw.write(makeToolCall('tc-1', 'Tool'))

        const types = writes.map((w) => (w as { type: string }).type)
        expect(types).not.toContain('text-end')
        expect(types).not.toContain('reasoning-end')
    })

    it('TOOL_CALL emits correct toolCallId and toolName in tool events', () => {
        const { writer, writes } = makeMockWriter()
        const sw = createStreamWriter({ writer, textPartId: 'txt-1', reasoningPartId: 'rsn-1' })

        sw.write(makeToolCall('my-tool-id', 'Fancy Tool', { x: 1 }))

        const toolInputStart = writes.find((w) => (w as { type: string }).type === 'tool-input-start') as Record<string, unknown>
        expect(toolInputStart?.['toolCallId']).toBe('my-tool-id')
        expect(toolInputStart?.['toolName']).toBe('Fancy Tool')

        const toolInputAvailable = writes.find((w) => (w as { type: string }).type === 'tool-input-available') as Record<string, unknown>
        expect(toolInputAvailable?.['input']).toEqual({ x: 1 })
    })

    it('TOOL_CALL_UPDATE with "completed" status emits tool-output-available', () => {
        const { writer, writes } = makeMockWriter()
        const sw = createStreamWriter({ writer, textPartId: 'txt-1', reasoningPartId: 'rsn-1' })

        sw.write(makeToolCallUpdate('tc-1', 'completed', 'the output'))

        const outputEvent = writes.find((w) => (w as { type: string }).type === 'tool-output-available') as Record<string, unknown>
        expect(outputEvent).toBeDefined()
        expect(outputEvent?.['toolCallId']).toBe('tc-1')
        expect(outputEvent?.['output']).toBe('the output')
    })

    it('TOOL_CALL_UPDATE with non-"completed" status does not emit tool-output-available', () => {
        const { writer, writes } = makeMockWriter()
        const sw = createStreamWriter({ writer, textPartId: 'txt-1', reasoningPartId: 'rsn-1' })

        sw.write(makeToolCallUpdate('tc-1', 'in_progress'))

        expect(writes).toHaveLength(0)
    })

    it('SESSION_INFO_UPDATE emits data-session-title and calls onSessionTitle callback', () => {
        const { writer, writes } = makeMockWriter()
        const onSessionTitle = vi.fn()
        const sw = createStreamWriter({ writer, textPartId: 'txt-1', reasoningPartId: 'rsn-1', onSessionTitle })

        sw.write(makeSessionInfoUpdate('My Chat Session'))

        const titleEvent = writes.find((w) => (w as { type: string }).type === 'data-session-title') as Record<string, unknown>
        expect(titleEvent).toBeDefined()
        expect((titleEvent?.['data'] as { title: string })?.title).toBe('My Chat Session')
        expect(onSessionTitle).toHaveBeenCalledWith('My Chat Session')
    })

    it('SESSION_INFO_UPDATE with no title does not emit or call callback', () => {
        const { writer, writes } = makeMockWriter()
        const onSessionTitle = vi.fn()
        const sw = createStreamWriter({ writer, textPartId: 'txt-1', reasoningPartId: 'rsn-1', onSessionTitle })

        sw.write({ sessionUpdate: SandboxSessionUpdateType.SESSION_INFO_UPDATE })

        expect(writes).toHaveLength(0)
        expect(onSessionTitle).not.toHaveBeenCalled()
    })

    it('PLAN event emits data-plan with mapped entries', () => {
        const { writer, writes } = makeMockWriter()
        const sw = createStreamWriter({ writer, textPartId: 'txt-1', reasoningPartId: 'rsn-1' })

        sw.write(makePlan([
            { content: 'Step 1', status: 'done' },
            { content: 'Step 2', status: 'pending' },
        ]))

        const planEvent = writes.find((w) => (w as { type: string }).type === 'data-plan') as Record<string, unknown>
        expect(planEvent).toBeDefined()
        expect((planEvent?.['data'] as { entries: unknown[] })?.entries).toEqual([
            { content: 'Step 1', status: 'done' },
            { content: 'Step 2', status: 'pending' },
        ])
    })

    it('PLAN event with non-array entries does not emit', () => {
        const { writer, writes } = makeMockWriter()
        const sw = createStreamWriter({ writer, textPartId: 'txt-1', reasoningPartId: 'rsn-1' })

        sw.write({ sessionUpdate: SandboxSessionUpdateType.PLAN, entries: 'not-an-array' })

        expect(writes).toHaveLength(0)
    })

    it('USAGE_UPDATE emits data-usage with input and output tokens', () => {
        const { writer, writes } = makeMockWriter()
        const sw = createStreamWriter({ writer, textPartId: 'txt-1', reasoningPartId: 'rsn-1' })

        sw.write(makeUsageUpdate(1500, 300))

        const usageEvent = writes.find((w) => (w as { type: string }).type === 'data-usage') as Record<string, unknown>
        expect(usageEvent).toBeDefined()
        expect(usageEvent?.['data']).toEqual({ inputTokens: 1500, outputTokens: 300 })
    })

    it('USAGE_UPDATE falls back to "used" field for inputTokens', () => {
        const { writer, writes } = makeMockWriter()
        const sw = createStreamWriter({ writer, textPartId: 'txt-1', reasoningPartId: 'rsn-1' })

        sw.write({ sessionUpdate: SandboxSessionUpdateType.USAGE_UPDATE, used: 999, outputTokens: 50 })

        const usageEvent = writes.find((w) => (w as { type: string }).type === 'data-usage') as Record<string, unknown>
        expect((usageEvent?.['data'] as { inputTokens: number })?.inputTokens).toBe(999)
    })

    it('unrecognized sessionUpdate type emits nothing', () => {
        const { writer, writes } = makeMockWriter()
        const sw = createStreamWriter({ writer, textPartId: 'txt-1', reasoningPartId: 'rsn-1' })

        sw.write({ sessionUpdate: 'unknown_type', data: 'ignored' })

        expect(writes).toHaveLength(0)
    })

    it('update with no sessionUpdate field emits nothing', () => {
        const { writer, writes } = makeMockWriter()
        const sw = createStreamWriter({ writer, textPartId: 'txt-1', reasoningPartId: 'rsn-1' })

        sw.write({ content: { type: 'text', text: 'no type field' } })

        expect(writes).toHaveLength(0)
    })
})
