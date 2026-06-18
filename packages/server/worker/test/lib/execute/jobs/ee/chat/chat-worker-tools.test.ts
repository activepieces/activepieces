import { ToolProgressEvent } from '@activepieces/shared'
import { describe, expect, it, vi } from 'vitest'
import { ChatEventEmitter, chatWorkerTools } from '../../../../../../src/lib/execute/jobs/ee/chat/chat-worker-tools'

function makeMockEventEmitter(): { eventEmitter: ChatEventEmitter, progressEvents: ToolProgressEvent[] } {
    const progressEvents: ToolProgressEvent[] = []
    return {
        eventEmitter: {
            emitToolProgress: (data: ToolProgressEvent) => { progressEvents.push(data) },
            emitActionPreview: () => {},
            emitActionReceipt: () => {},
        },
        progressEvents,
    }
}

function mcpSuccess(text: string) {
    return { content: [{ type: 'text', text: `✅ ${text}` }] }
}

function mcpFailure(text: string) {
    return { content: [{ type: 'text', text: `❌ ${text}` }] }
}

describe('chatWorkerTools', () => {
    describe('isSuccessResult', () => {
        it('returns true for MCP success result', () => {
            expect(chatWorkerTools.isSuccessResult(mcpSuccess('Done'))).toBe(true)
        })

        it('returns false for MCP failure result', () => {
            expect(chatWorkerTools.isSuccessResult(mcpFailure('Something broke'))).toBe(false)
        })

        it('returns false for timeout result', () => {
            const result = { content: [{ type: 'text', text: '⏳ Action still running after 120s.' }] }
            expect(chatWorkerTools.isSuccessResult(result)).toBe(false)
        })

        it('returns false for structured error result', () => {
            expect(chatWorkerTools.isSuccessResult({ success: false, error: 'No projects' })).toBe(false)
        })

        it('returns false for isError flag', () => {
            expect(chatWorkerTools.isSuccessResult({ content: [{ type: 'text', text: 'error' }], isError: true })).toBe(false)
        })

        it('returns false for null', () => {
            expect(chatWorkerTools.isSuccessResult(null)).toBe(false)
        })

        it('returns false for string', () => {
            expect(chatWorkerTools.isSuccessResult('some string')).toBe(false)
        })

        it('returns false for object without content array', () => {
            expect(chatWorkerTools.isSuccessResult({ data: 'something' })).toBe(false)
        })
    })

    describe('extractResultText', () => {
        it('extracts text from MCP content array', () => {
            const result = { content: [{ type: 'text', text: 'Hello' }, { type: 'text', text: 'World' }] }
            expect(chatWorkerTools.extractResultText(result)).toBe('Hello\nWorld')
        })

        it('returns error field directly', () => {
            expect(chatWorkerTools.extractResultText({ success: false, error: 'No projects available' })).toBe('No projects available')
        })

        it('returns raw string as-is', () => {
            expect(chatWorkerTools.extractResultText('raw text')).toBe('raw text')
        })

        it('JSON-stringifies non-object non-string values', () => {
            expect(chatWorkerTools.extractResultText(42)).toBe('42')
            expect(chatWorkerTools.extractResultText(null)).toBe('null')
        })

        it('JSON-stringifies objects without content or error', () => {
            expect(chatWorkerTools.extractResultText({ data: 'value' })).toBe('{"data":"value"}')
        })

        it('skips non-text content items', () => {
            const result = { content: [{ type: 'image', url: 'http://...' }, { type: 'text', text: 'Hello' }] }
            expect(chatWorkerTools.extractResultText(result)).toBe('Hello')
        })
    })

    describe('ap_execute_action batch mode', () => {
        it('calls executeTool for each item and emits progress events', async () => {
            const { eventEmitter, progressEvents } = makeMockEventEmitter()
            const executeTool = vi.fn().mockResolvedValue(mcpSuccess('sent'))

            const tools = chatWorkerTools.createCrossProjectTools({ executeTool, eventEmitter, waitForApproval: vi.fn().mockResolvedValue({ approved: true }) })
            const result = await tools.ap_execute_action.execute({
                pieceName: 'slack',
                actionName: 'send_message',
                items: [
                    { channel: 'C01', text: 'Hi Alice' },
                    { channel: 'C02', text: 'Hi Bob' },
                    { channel: 'C03', text: 'Hi Carol' },
                ],
                description: 'Sending messages',
            }, { toolCallId: 'tc1', messages: [], abortSignal: undefined as unknown as AbortSignal })

            expect(executeTool).toHaveBeenCalledTimes(3)
            expect(executeTool).toHaveBeenCalledWith('ap_execute_action', expect.objectContaining({
                pieceName: 'slack',
                actionName: 'send_message',
                input: { channel: 'C01', text: 'Hi Alice' },
            }))

            expect(progressEvents.length).toBe(2)
            expect(progressEvents[0].toolCallId).toBe('tc1')

            const initial = progressEvents[0].data
            expect(initial.completed).toBe(0)
            expect(initial.total).toBe(3)
            expect(initial.done).toBe(false)
            expect(initial.label).toBe('Sending messages')

            const final = progressEvents[progressEvents.length - 1].data
            expect(final.completed).toBe(3)
            expect(final.succeeded).toBe(3)
            expect(final.failed).toBe(0)
            expect(final.done).toBe(true)
            expect(final.results.length).toBe(3)

            const resultObj = result as { content: Array<{ text: string }>, batchProgress: Record<string, unknown> }
            expect(resultObj.content[0].text).toContain('3/3 succeeded')
            expect(resultObj.content[0].text).toContain('0 failed')

            expect(resultObj.batchProgress).toBeDefined()
            expect(resultObj.batchProgress['succeeded']).toBe(3)
            expect(resultObj.batchProgress['failed']).toBe(0)
            expect(resultObj.batchProgress['done']).toBe(true)
        })

        it('continues on error and reports failures', async () => {
            const { eventEmitter, progressEvents } = makeMockEventEmitter()
            const executeTool = vi.fn()
                .mockResolvedValueOnce(mcpSuccess('sent'))
                .mockResolvedValueOnce(mcpFailure('Invalid channel'))
                .mockResolvedValueOnce(mcpSuccess('sent'))

            const tools = chatWorkerTools.createCrossProjectTools({ executeTool, eventEmitter, waitForApproval: vi.fn().mockResolvedValue({ approved: true }) })
            const result = await tools.ap_execute_action.execute({
                pieceName: 'slack',
                actionName: 'send_message',
                items: [
                    { channel: 'C01', text: 'Hi' },
                    { channel: 'INVALID', text: 'Hi' },
                    { channel: 'C03', text: 'Hi' },
                ],
            }, { toolCallId: 'tc2', messages: [], abortSignal: undefined as unknown as AbortSignal })

            expect(executeTool).toHaveBeenCalledTimes(3)

            const final = progressEvents[progressEvents.length - 1].data
            expect(final.succeeded).toBe(2)
            expect(final.failed).toBe(1)
            expect(final.done).toBe(true)

            const failedItem = final.results.find((r) => !r.success)
            expect(failedItem).toBeDefined()
            expect(failedItem!.index).toBe(1)
            expect(failedItem!.error).toContain('Invalid channel')

            const resultObj = result as { content: Array<{ text: string }> }
            expect(resultObj.content[0].text).toContain('2/3 succeeded')
            expect(resultObj.content[0].text).toContain('1 failed')
            expect(resultObj.content[0].text).toContain('#2')
        })

        it('uses default label when description is not provided', async () => {
            const { eventEmitter, progressEvents } = makeMockEventEmitter()
            const executeTool = vi.fn().mockResolvedValue(mcpSuccess('done'))

            const tools = chatWorkerTools.createCrossProjectTools({ executeTool, eventEmitter, waitForApproval: vi.fn().mockResolvedValue({ approved: true }) })
            await tools.ap_execute_action.execute({
                pieceName: 'http',
                actionName: 'send_request',
                items: [{ url: 'http://example.com' }],
            }, { toolCallId: 'tc3', messages: [], abortSignal: undefined as unknown as AbortSignal })

            const initial = progressEvents[0].data
            expect(initial.label).toBe('Processing 1 item')
        })

        it('all progress events share the same toolCallId', async () => {
            const { eventEmitter, progressEvents } = makeMockEventEmitter()
            const executeTool = vi.fn().mockResolvedValue(mcpSuccess('done'))

            const tools = chatWorkerTools.createCrossProjectTools({ executeTool, eventEmitter, waitForApproval: vi.fn().mockResolvedValue({ approved: true }) })
            await tools.ap_execute_action.execute({
                pieceName: 'slack',
                actionName: 'send_message',
                items: [{ channel: 'C01', text: 'Hi' }, { channel: 'C02', text: 'Hi' }],
            }, { toolCallId: 'tc4', messages: [], abortSignal: undefined as unknown as AbortSignal })

            const ids = progressEvents.map((e) => e.toolCallId)
            expect(ids.every((id) => id === 'tc4')).toBe(true)
        })

        it('sends empty results array for intermediate events', async () => {
            const { eventEmitter, progressEvents } = makeMockEventEmitter()
            const executeTool = vi.fn().mockResolvedValue(mcpSuccess('done'))

            const tools = chatWorkerTools.createCrossProjectTools({ executeTool, eventEmitter, waitForApproval: vi.fn().mockResolvedValue({ approved: true }) })
            await tools.ap_execute_action.execute({
                pieceName: 'slack',
                actionName: 'send_message',
                items: [{ channel: 'C01', text: 'Hi' }, { channel: 'C02', text: 'Hi' }],
            }, { toolCallId: 'tc5', messages: [], abortSignal: undefined as unknown as AbortSignal })

            const intermediate = progressEvents.slice(0, -1)
            for (const event of intermediate) {
                expect(event.data.results).toEqual([])
            }
            const final = progressEvents[progressEvents.length - 1].data
            expect(final.results.length).toBe(2)
        })

        it('falls back to single-item mode when items is absent', async () => {
            const { eventEmitter } = makeMockEventEmitter()
            const executeTool = vi.fn().mockResolvedValue(mcpSuccess('done'))

            const tools = chatWorkerTools.createCrossProjectTools({ executeTool, eventEmitter, waitForApproval: vi.fn().mockResolvedValue({ approved: true }) })
            await tools.ap_execute_action.execute({
                pieceName: 'gmail',
                actionName: 'send_email',
                input: { to: 'test@example.com' },
            }, { toolCallId: 'tc6', messages: [], abortSignal: undefined as unknown as AbortSignal })

            expect(executeTool).toHaveBeenCalledTimes(1)
            expect(executeTool).toHaveBeenCalledWith('ap_execute_action', expect.objectContaining({
                pieceName: 'gmail',
                actionName: 'send_email',
                input: { to: 'test@example.com' },
            }))
        })

        it('handles structured error results from executeCrossProjectTool', async () => {
            const { eventEmitter, progressEvents } = makeMockEventEmitter()
            const executeTool = vi.fn()
                .mockResolvedValueOnce({ success: false, error: 'No projects available' })

            const tools = chatWorkerTools.createCrossProjectTools({ executeTool, eventEmitter, waitForApproval: vi.fn().mockResolvedValue({ approved: true }) })
            const result = await tools.ap_execute_action.execute({
                pieceName: 'slack',
                actionName: 'send_message',
                items: [{ channel: 'C01', text: 'Hi' }],
            }, { toolCallId: 'tc7', messages: [], abortSignal: undefined as unknown as AbortSignal })

            const final = progressEvents[progressEvents.length - 1].data
            expect(final.failed).toBe(1)
            expect(final.succeeded).toBe(0)

            const resultObj = result as { content: Array<{ text: string }> }
            expect(resultObj.content[0].text).toContain('0/1 succeeded')
        })

        it('stops early once consecutive failures cross the limit', async () => {
            const { eventEmitter, progressEvents } = makeMockEventEmitter()
            const executeTool = vi.fn().mockResolvedValue(mcpFailure('Bad auth'))

            const tools = chatWorkerTools.createCrossProjectTools({ executeTool, eventEmitter, waitForApproval: vi.fn().mockResolvedValue({ approved: true }) })
            const result = await tools.ap_execute_action.execute({
                pieceName: 'slack',
                actionName: 'send_message',
                items: Array.from({ length: 10 }, (_, i) => ({ channel: `C${i}`, text: 'Hi' })),
                description: 'Sending messages',
            }, { toolCallId: 'tc8', messages: [], abortSignal: undefined as unknown as AbortSignal })

            // Items run concurrently in chunks of 5; the first chunk all fails, crossing
            // the limit of 3, so it stops after that chunk — 5 ran, the remaining 5 skipped.
            expect(executeTool).toHaveBeenCalledTimes(5)

            const final = progressEvents[progressEvents.length - 1].data
            expect(final.failed).toBe(5)
            expect(final.completed).toBe(5)
            expect(final.total).toBe(10)
            expect(final.done).toBe(true)

            const resultObj = result as { content: Array<{ text: string }> }
            expect(resultObj.content[0].text).toContain('Stopped early')
            expect(resultObj.content[0].text).toContain('5 items skipped')
        })

        it('resets consecutive failure count on success', async () => {
            const { eventEmitter } = makeMockEventEmitter()
            const executeTool = vi.fn()
                .mockResolvedValueOnce(mcpFailure('err'))
                .mockResolvedValueOnce(mcpFailure('err'))
                .mockResolvedValueOnce(mcpSuccess('ok'))
                .mockResolvedValueOnce(mcpFailure('err'))
                .mockResolvedValueOnce(mcpFailure('err'))
                .mockResolvedValueOnce(mcpSuccess('ok'))

            const tools = chatWorkerTools.createCrossProjectTools({ executeTool, eventEmitter, waitForApproval: vi.fn().mockResolvedValue({ approved: true }) })
            await tools.ap_execute_action.execute({
                pieceName: 'slack',
                actionName: 'send_message',
                items: Array.from({ length: 6 }, (_, i) => ({ channel: `C${i}` })),
            }, { toolCallId: 'tc9', messages: [], abortSignal: undefined as unknown as AbortSignal })

            expect(executeTool).toHaveBeenCalledTimes(6)
        })
    })

    describe('shrinkLargeValue', () => {
        it('truncates long strings with a marker and keeps short ones', () => {
            const long = 'a'.repeat(5000)
            const result = chatWorkerTools.shrinkLargeValue({ short: 'hi', long }, { maxStringLength: 2000, maxArrayItems: 20 }) as Record<string, string>
            expect(result.short).toBe('hi')
            expect(result.long.startsWith('a'.repeat(2000))).toBe(true)
            expect(result.long).toContain('…[truncated 3000 chars]')
        })

        it('caps arrays and appends an overflow marker', () => {
            const arr = Array.from({ length: 50 }, (_, i) => i)
            const result = chatWorkerTools.shrinkLargeValue(arr, { maxStringLength: 2000, maxArrayItems: 20 }) as unknown[]
            expect(result.length).toBe(21)
            expect(result[20]).toBe('…and 30 more items')
        })

        it('preserves nested object structure', () => {
            const input = { a: { b: { c: 'value' } }, list: [1, 2] }
            const result = chatWorkerTools.shrinkLargeValue(input, { maxStringLength: 2000, maxArrayItems: 20 })
            expect(result).toEqual(input)
        })
    })

    describe('truncateLargeResult', () => {
        it('returns small results unchanged', () => {
            const small = { ok: true, items: [1, 2, 3] }
            expect(chatWorkerTools.truncateLargeResult(small)).toBe(small)
        })

        it('previews the first 3 items of a large top-level array', () => {
            const result = chatWorkerTools.truncateLargeResult({
                items: Array.from({ length: 5000 }, (_, i) => ({ id: i, text: 'x'.repeat(50) })),
            }) as { content: Array<{ text: string }> }
            const text = result.content[0].text
            expect(text).toContain('[LARGE RESPONSE]')
            expect(text).toContain('5000 items')
            expect(text).toContain('Preview (3 of 5000 items)')
        })

        it('structurally shrinks a large non-array object instead of discarding it', () => {
            const result = chatWorkerTools.truncateLargeResult({
                description: 'd'.repeat(60_000),
                detail: 'e'.repeat(60_000),
            }) as { content: Array<{ text: string }> }
            const text = result.content[0].text
            expect(text).toContain('long values were truncated to fit, structure preserved')
            expect(text).toContain('…[truncated')
            expect(text).toContain('description')
            expect(text).toContain('detail')
        })

        it('truncates based on byte size, not UTF-16 length (multibyte)', () => {
            const emojiHeavy = { s: '😀'.repeat(30_000) }
            expect(JSON.stringify(emojiHeavy).length).toBeLessThanOrEqual(100 * 1024)
            const result = chatWorkerTools.truncateLargeResult(emojiHeavy)
            expect(result).not.toBe(emojiHeavy)
            expect(result).toHaveProperty('content')
        })
    })
})
