import { ActionPreviewEvent, ActionReceiptEvent, AutoConsentJudge, chatConsent, SendChatEmailResponse, ToolProgressEvent } from '@activepieces/shared'
import { describe, expect, it, vi } from 'vitest'
import { ChatEventEmitter, chatWorkerTools } from '../../../../../../src/lib/execute/jobs/ee/chat/chat-worker-tools'

function makeMockEventEmitter(): { eventEmitter: ChatEventEmitter, progressEvents: ToolProgressEvent[], previewEvents: ActionPreviewEvent[] } {
    const progressEvents: ToolProgressEvent[] = []
    const previewEvents: ActionPreviewEvent[] = []
    return {
        eventEmitter: {
            emitToolProgress: (data: ToolProgressEvent) => {
                progressEvents.push(data)
            },
            emitActionPreview: (data: ActionPreviewEvent) => {
                previewEvents.push(data)
            },
            emitActionReceipt: () => {},
        },
        progressEvents,
        previewEvents,
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

    describe('extractUserFacingError', () => {
        it('prefers the clean summary from _meta', () => {
            const result = { content: [{ type: 'text', text: '❌ Send HTTP request failed (run abc): The request body contains invalid JSON. (400)\n\nRetry suggestion: Check the error above.' }] }
            const meta = { errorSummary: 'The request body contains invalid JSON. (400)' }
            expect(chatWorkerTools.extractUserFacingError({ result, meta })).toBe('The request body contains invalid JSON. (400)')
        })

        it('strips emoji and retry coaching when no summary is present', () => {
            const result = { content: [{ type: 'text', text: '❌ Action failed (run abc): Something broke.\n\nRetry suggestion: Try again later.' }] }
            expect(chatWorkerTools.extractUserFacingError({ result })).toBe('Action failed (run abc): Something broke.')
        })

        it('truncates very long raw errors', () => {
            const longError = 'x'.repeat(500)
            const out = chatWorkerTools.extractUserFacingError({ result: { error: longError } })
            expect(out.length).toBeLessThanOrEqual(301)
            expect(out.endsWith('…')).toBe(true)
        })
    })

    describe('ap_execute_action batch mode', () => {
        it('calls executeTool for each item and emits progress events', async () => {
            const { eventEmitter, progressEvents } = makeMockEventEmitter()
            const executeTool = vi.fn().mockResolvedValue(mcpSuccess('sent'))

            const tools = chatWorkerTools.createCrossProjectTools({ executeTool, eventEmitter, waitForApproval: vi.fn().mockResolvedValue({ outcome: 'approved' }), guides: {}, taintState: { tainted: false } })
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

            const tools = chatWorkerTools.createCrossProjectTools({ executeTool, eventEmitter, waitForApproval: vi.fn().mockResolvedValue({ outcome: 'approved' }), guides: {}, taintState: { tainted: false } })
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

            const tools = chatWorkerTools.createCrossProjectTools({ executeTool, eventEmitter, waitForApproval: vi.fn().mockResolvedValue({ outcome: 'approved' }), guides: {}, taintState: { tainted: false } })
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

            const tools = chatWorkerTools.createCrossProjectTools({ executeTool, eventEmitter, waitForApproval: vi.fn().mockResolvedValue({ outcome: 'approved' }), guides: {}, taintState: { tainted: false } })
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

            const tools = chatWorkerTools.createCrossProjectTools({ executeTool, eventEmitter, waitForApproval: vi.fn().mockResolvedValue({ outcome: 'approved' }), guides: {}, taintState: { tainted: false } })
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

            const tools = chatWorkerTools.createCrossProjectTools({ executeTool, eventEmitter, waitForApproval: vi.fn().mockResolvedValue({ outcome: 'approved' }), guides: {}, taintState: { tainted: false } })
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

            const tools = chatWorkerTools.createCrossProjectTools({ executeTool, eventEmitter, waitForApproval: vi.fn().mockResolvedValue({ outcome: 'approved' }), guides: {}, taintState: { tainted: false } })
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

            const tools = chatWorkerTools.createCrossProjectTools({ executeTool, eventEmitter, waitForApproval: vi.fn().mockResolvedValue({ outcome: 'approved' }), guides: {}, taintState: { tainted: false } })
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

            const tools = chatWorkerTools.createCrossProjectTools({ executeTool, eventEmitter, waitForApproval: vi.fn().mockResolvedValue({ outcome: 'approved' }), guides: {}, taintState: { tainted: false } })
            await tools.ap_execute_action.execute({
                pieceName: 'slack',
                actionName: 'send_message',
                items: Array.from({ length: 6 }, (_, i) => ({ channel: `C${i}` })),
            }, { toolCallId: 'tc9', messages: [], abortSignal: undefined as unknown as AbortSignal })

            expect(executeTool).toHaveBeenCalledTimes(6)
        })
    })

    describe('ap_execute_action taint gate', () => {
        it('forces the approval gate for a non-read-only action once the turn is tainted', async () => {
            const { eventEmitter } = makeMockEventEmitter()
            const executeTool = vi.fn().mockResolvedValue(mcpSuccess('ok'))
            const waitForApproval = vi.fn().mockResolvedValue({ outcome: 'approved' })
            const tools = chatWorkerTools.createCrossProjectTools({ executeTool, eventEmitter, waitForApproval, guides: {}, taintState: { tainted: true } })

            await tools.ap_execute_action.execute({
                pieceName: 'slack', actionName: 'do_thing', needsConfirmation: false, input: {},
            }, { toolCallId: 'tc-taint', messages: [], abortSignal: undefined as unknown as AbortSignal })

            expect(waitForApproval).toHaveBeenCalledWith({ gateId: 'tc-taint' })
        })

        it('does not gate a read action when the turn is untainted', async () => {
            const { eventEmitter } = makeMockEventEmitter()
            const executeTool = vi.fn().mockResolvedValue(mcpSuccess('ok'))
            const waitForApproval = vi.fn().mockResolvedValue({ outcome: 'approved' })
            const tools = chatWorkerTools.createCrossProjectTools({ executeTool, eventEmitter, waitForApproval, guides: {}, taintState: { tainted: false } })

            await tools.ap_execute_action.execute({
                pieceName: 'slack', actionName: 'getChannelHistory', needsConfirmation: false, input: {},
            }, { toolCallId: 'tc-clean', messages: [], abortSignal: undefined as unknown as AbortSignal })

            expect(waitForApproval).not.toHaveBeenCalled()
        })

        it('gates an action nothing can classify, even untainted and marked no-confirmation', async () => {
            const { eventEmitter } = makeMockEventEmitter()
            const executeTool = vi.fn().mockResolvedValue(mcpSuccess('ok'))
            const waitForApproval = vi.fn().mockResolvedValue({ outcome: 'approved' })
            const tools = chatWorkerTools.createCrossProjectTools({ executeTool, eventEmitter, waitForApproval, guides: {}, taintState: { tainted: false } })

            await tools.ap_execute_action.execute({
                pieceName: 'slack', actionName: 'do_thing', needsConfirmation: false, input: {},
            }, { toolCallId: 'tc-unknown', messages: [], abortSignal: undefined as unknown as AbortSignal })

            expect(waitForApproval).toHaveBeenCalledWith({ gateId: 'tc-unknown' })
        })
    })

    describe('gate timeout vs decline', () => {
        const runExecuteActionWith = async (outcome: 'timeout' | 'declined') => {
            const { eventEmitter } = makeMockEventEmitter()
            const executeTool = vi.fn().mockResolvedValue(mcpSuccess('ok'))
            const waitForApproval = vi.fn().mockResolvedValue({ outcome })
            const tools = chatWorkerTools.createCrossProjectTools({ executeTool, eventEmitter, waitForApproval, guides: {}, taintState: { tainted: false } })
            const result = await tools.ap_execute_action.execute({
                pieceName: 'slack', actionName: 'send_message', input: { channel: 'C1' },
            }, { toolCallId: 'tc-gate', messages: [], abortSignal: undefined as unknown as AbortSignal })
            return { result: result as { content: Array<{ text: string }>, _agentGuidance: string }, executeTool }
        }

        it('on timeout, shows the user one short line and carries the model guidance out of band', async () => {
            const { result, executeTool } = await runExecuteActionWith('timeout')
            expect(result.content).toHaveLength(1)
            expect(result.content[0].text).toBe('⏳ Waiting on your go-ahead — nothing ran.')
            expect(result._agentGuidance).toMatch(/hasn't responded|timed out/i)
            expect(result._agentGuidance).toMatch(/skip|approve/i)
            expect(executeTool).not.toHaveBeenCalled()
        })

        it('on an explicit decline, shows the user one short line and tells the model not to reroute', async () => {
            const { result, executeTool } = await runExecuteActionWith('declined')
            expect(result.content).toHaveLength(1)
            expect(result.content[0].text).toBe('❌ You declined this — nothing was changed.')
            expect(result._agentGuidance).toContain('Action cancelled by user.')
            expect(result._agentGuidance).toContain('another tool')
            expect(executeTool).not.toHaveBeenCalled()
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

        it('previews the first 5 items of a large top-level array', () => {
            const result = chatWorkerTools.truncateLargeResult({
                items: Array.from({ length: 5000 }, (_, i) => ({ id: i, text: 'x'.repeat(300) })),
            }) as { content: Array<{ text: string }> }
            const text = result.content[0].text
            expect(text).toContain('[LARGE RESPONSE]')
            expect(text).toContain('5000 items')
            expect(text).toContain('Preview (5 of 5000 items)')
        })

        it('structurally shrinks a large non-array object instead of discarding it', () => {
            const result = chatWorkerTools.truncateLargeResult({
                description: 'd'.repeat(600_000),
                detail: 'e'.repeat(600_000),
            }) as { content: Array<{ text: string }> }
            const text = result.content[0].text
            expect(text).toContain('long values were truncated to fit, structure preserved')
            expect(text).toContain('…[truncated')
            expect(text).toContain('description')
            expect(text).toContain('detail')
        })

        it('truncates based on byte size, not UTF-16 length (multibyte)', () => {
            const emojiHeavy = { s: '😀'.repeat(300_000) }
            expect(JSON.stringify(emojiHeavy).length).toBeLessThanOrEqual(1024 * 1024)
            const result = chatWorkerTools.truncateLargeResult(emojiHeavy)
            expect(result).not.toBe(emojiHeavy)
            expect(result).toHaveProperty('content')
        })
    })

    describe('ap_execute_action progress guard', () => {
        const callOptions = { messages: [], abortSignal: undefined as unknown as AbortSignal }

        it('stops retrying an identical call after it fails MAX_IDENTICAL_ACTION_FAILURES times', async () => {
            const { eventEmitter } = makeMockEventEmitter()
            const executeTool = vi.fn().mockResolvedValue(mcpFailure('The request body contains invalid JSON. (400)'))
            const tools = chatWorkerTools.createCrossProjectTools({ executeTool, eventEmitter, waitForApproval: vi.fn().mockResolvedValue({ outcome: 'approved' }), guides: {}, taintState: { tainted: false } })

            const input = { pieceName: '@activepieces/piece-http', actionName: 'send_request', input: { url: 'https://x', body: { type: 'json_raw' } } }
            await tools.ap_execute_action.execute(input, { ...callOptions, toolCallId: 'g1' })
            await tools.ap_execute_action.execute(input, { ...callOptions, toolCallId: 'g2' })
            const third = await tools.ap_execute_action.execute(input, { ...callOptions, toolCallId: 'g3' })

            expect(executeTool).toHaveBeenCalledTimes(2)
            const text = (third as { content: Array<{ text: string }> }).content[0].text
            expect(text).toContain('already failed')
            expect(text).toContain('ap_get_piece_props')
        })

        it('blocks re-running a write action that already succeeded (duplicate-send guard)', async () => {
            const { eventEmitter } = makeMockEventEmitter()
            const executeTool = vi.fn().mockResolvedValue(mcpSuccess('Sent (204)'))
            const tools = chatWorkerTools.createCrossProjectTools({ executeTool, eventEmitter, waitForApproval: vi.fn().mockResolvedValue({ outcome: 'approved' }), guides: {}, taintState: { tainted: false } })

            const input = { pieceName: '@activepieces/piece-http', actionName: 'send_request', input: { url: 'https://x', body_type: 'json', body: { data: { content: 'hi' } } } }
            await tools.ap_execute_action.execute(input, { ...callOptions, toolCallId: 's1' })
            const second = await tools.ap_execute_action.execute(input, { ...callOptions, toolCallId: 's2' })

            expect(executeTool).toHaveBeenCalledTimes(1)
            expect((second as { content: Array<{ text: string }> }).content[0].text).toContain('already ran successfully')
        })

        it('allows a different input through after a failure (key is input-specific)', async () => {
            const { eventEmitter } = makeMockEventEmitter()
            const executeTool = vi.fn().mockResolvedValue(mcpSuccess('Sent'))
            const tools = chatWorkerTools.createCrossProjectTools({ executeTool, eventEmitter, waitForApproval: vi.fn().mockResolvedValue({ outcome: 'approved' }), guides: {}, taintState: { tainted: false } })

            await tools.ap_execute_action.execute({ pieceName: 'p', actionName: 'send_request', input: { a: 1 } }, { ...callOptions, toolCallId: 'a1' })
            await tools.ap_execute_action.execute({ pieceName: 'p', actionName: 'send_request', input: { a: 2 } }, { ...callOptions, toolCallId: 'a2' })

            expect(executeTool).toHaveBeenCalledTimes(2)
        })
    })

    describe('truncateLargeResult', () => {
        const MAX_RESULT_SIZE_BYTES = 128 * 1024

        const serializedBytes = (value: unknown): number => Buffer.byteLength(JSON.stringify(value), 'utf8')

        it('caps the exact incident shape — MCP { content: [{ text: <huge> }] }', () => {
            const huge = JSON.stringify({ data: 'x'.repeat(1200 * 1024) })
            const input = { content: [{ type: 'text', text: huge }] }
            const out = chatWorkerTools.truncateLargeResult(input)
            expect(serializedBytes(out)).toBeLessThanOrEqual(MAX_RESULT_SIZE_BYTES)
        })

        it('caps a root array of thousands of small objects (preview path)', () => {
            const input = Array.from({ length: 30_000 }, (_, i) => ({ id: i, name: `item-${i}`, note: 'lorem ipsum dolor' }))
            const out = chatWorkerTools.truncateLargeResult(input)
            expect(serializedBytes(out)).toBeLessThanOrEqual(MAX_RESULT_SIZE_BYTES)
        })

        it('caps an object with one giant string field (shrink path)', () => {
            const input = { status: 200, body: 'y'.repeat(1200 * 1024) }
            const out = chatWorkerTools.truncateLargeResult(input)
            expect(serializedBytes(out)).toBeLessThanOrEqual(MAX_RESULT_SIZE_BYTES)
        })

        it('caps a >3-length array whose items are each huge (preview re-check falls through to shrink)', () => {
            const input = { rows: Array.from({ length: 5 }, (_, i) => ({ id: i, blob: 'z'.repeat(300 * 1024) })) }
            const out = chatWorkerTools.truncateLargeResult(input)
            expect(serializedBytes(out)).toBeLessThanOrEqual(MAX_RESULT_SIZE_BYTES)
        })

        it('caps a huge primitive string', () => {
            const out = chatWorkerTools.truncateLargeResult('w'.repeat(1200 * 1024))
            expect(serializedBytes(out)).toBeLessThanOrEqual(MAX_RESULT_SIZE_BYTES)
        })

        it('preserves a top-level _meta after truncation', () => {
            const input = { _meta: { pieceName: '@activepieces/piece-attio', connectionLabel: 'Attio0' }, content: [{ type: 'text', text: 'x'.repeat(1200 * 1024) }] }
            const out = chatWorkerTools.truncateLargeResult(input)
            expect(serializedBytes(out)).toBeLessThanOrEqual(MAX_RESULT_SIZE_BYTES)
            expect(out).toHaveProperty('_meta', input._meta)
        })

        it('does not throw on a circular object and still caps the result', () => {
            const circular: Record<string, unknown> = { big: 'q'.repeat(1200 * 1024) }
            circular['self'] = circular
            expect(() => chatWorkerTools.truncateLargeResult(circular)).not.toThrow()
            expect(serializedBytes(chatWorkerTools.truncateLargeResult(circular))).toBeLessThanOrEqual(MAX_RESULT_SIZE_BYTES)
        })

        it('returns small results unchanged', () => {
            const input = { content: [{ type: 'text', text: '✅ Listed 3 connections' }] }
            expect(chatWorkerTools.truncateLargeResult(input)).toBe(input)
        })
    })

    describe('createEmailTools / ap_send_email', () => {
        const callOptions = { messages: [], abortSignal: undefined as unknown as AbortSignal }

        const SELF_EMAIL = 'me@acme.com'

        function setup({ sendImpl, approved = true }: { sendImpl?: () => Promise<SendChatEmailResponse>, approved?: boolean } = {}) {
            const previews: ActionPreviewEvent[] = []
            const receipts: ActionReceiptEvent[] = []
            const eventEmitter: ChatEventEmitter = {
                emitToolProgress: () => {},
                emitActionPreview: (data: ActionPreviewEvent) => {
                    previews.push(data) 
                },
                emitActionReceipt: (data: ActionReceiptEvent) => {
                    receipts.push(data) 
                },
            }
            const sendEmail = vi.fn(sendImpl ?? (async () => ({ sent: true, message: 'Email sent to x.' })))
            const waitForApproval = vi.fn().mockResolvedValue({ outcome: approved ? 'approved' : 'declined' })
            const tools = chatWorkerTools.createEmailTools({ sendEmail, eventEmitter, userEmail: SELF_EMAIL, waitForApproval })
            return { tools, previews, receipts, sendEmail, waitForApproval }
        }

        it('sends to the user\'s own address immediately, with no confirmation card', async () => {
            const { tools, previews, receipts, sendEmail, waitForApproval } = setup()
            await tools.ap_send_email.execute(
                { to: [SELF_EMAIL], subject: 'FYI', body: 'hi' },
                { ...callOptions, toolCallId: 'e1' },
            )
            expect(previews).toHaveLength(0)
            expect(waitForApproval).not.toHaveBeenCalled()
            expect(sendEmail).toHaveBeenCalledOnce()
            expect(receipts[0].status).toBe('success')
        })

        it('requires confirmation for an external recipient and sends once approved', async () => {
            const { tools, previews, sendEmail, waitForApproval } = setup({ approved: true })
            await tools.ap_send_email.execute(
                { to: ['teammate@acme.com'], subject: 'FYI', body: 'hi' },
                { ...callOptions, toolCallId: 'e2' },
            )
            expect(previews).toHaveLength(1)
            expect(previews[0]).toMatchObject({ toolCallId: 'e2', actionName: 'ap_send_email' })
            expect(waitForApproval).toHaveBeenCalledOnce()
            expect(sendEmail).toHaveBeenCalledOnce()
            expect(sendEmail.mock.calls[0][0]).toMatchObject({ to: ['teammate@acme.com'], subject: 'FYI' })
        })

        it('does not send an external email when the user cancels', async () => {
            const { tools, previews, sendEmail } = setup({ approved: false })
            const result = await tools.ap_send_email.execute(
                { to: ['out@gmail.com'], subject: 'Hi', body: 'hi' },
                { ...callOptions, toolCallId: 'e3' },
            )
            expect(previews).toHaveLength(1)
            expect(sendEmail).not.toHaveBeenCalled()
            expect(JSON.stringify(result)).toContain('cancelled')
        })

        it('reports failure when the send fails server-side', async () => {
            const { tools, receipts, sendEmail } = setup({ sendImpl: async () => ({ sent: false, message: 'rate limit reached' }) })
            await tools.ap_send_email.execute(
                { to: ['out@gmail.com'], subject: 'Hi', body: 'hi' },
                { ...callOptions, toolCallId: 'e4' },
            )
            expect(sendEmail).toHaveBeenCalledOnce()
            expect(receipts[0].status).toBe('failed')
        })
    })
})

type FakeGate = { gateId: string, displayName: string }

const CONSENT_GATED_TOOL_NAMES = ['ap_test_flow', 'ap_test_step', 'ap_retry_run', 'ap_run_code', 'ap_delete_flow', 'ap_delete_table', 'ap_delete_records', 'ap_lock_and_publish', 'ap_change_flow_status', 'ap_manage_fields', 'mcp__attio__create_record', 'mcp__stripe__create_refund', 'mcp__attio__delete_record', 'ap_brand_new_tool', 'ap_list_flows', 'ap_flow_structure', 'ap_insert_records', 'ap_add_step']

function makeConsentHarness({ effects, decision = 'approved', remembered = false, resolved = true, disabled = false, policy, serverTargetName, autoJudge, tainted = false }: {
    effects: { stepName: string, displayName: string, kind: string, detail: string, recipient?: string, inputDigest?: string }[]
    decision?: 'approved' | 'declined' | 'timeout'
    remembered?: boolean
    resolved?: boolean
    disabled?: boolean
    policy?: ReturnType<typeof chatConsent.composePolicy>
    serverTargetName?: string
    autoJudge?: AutoConsentJudge
    tainted?: boolean
}) {
    const ran: unknown[] = []
    const previews: ActionPreviewEvent[] = []
    const gates: FakeGate[] = []
    const remembers: string[] = []
    const checked: string[] = []
    const previewCalls: unknown[] = []
    const targetNameCalls: unknown[] = []
    const auditCalls: { toolName: string, displayName?: string, effectKinds?: string[] }[] = []

    const tools = Object.fromEntries(CONSENT_GATED_TOOL_NAMES.map((toolName) => [toolName, {
        execute: async (args: unknown) => {
            ran.push({ toolName, args })
            return { content: [{ type: 'text', text: '✅ ran' }] }
        },
    }]))

    const wrapped = chatWorkerTools.wrapWithConsent({
        tools,
        disabled,
        policy,
        previewFlowEffects: async (params) => {
            previewCalls.push(params)
            return {
                resolved,
                flowName: 'Daily Sales Digest',
                effects: effects.map((step) => ({
                    stepName: step.stepName,
                    displayName: step.displayName,
                    detail: step.detail,
                    opaque: false,
                    effect: { kind: step.kind, source: 'catalog' },
                    ...(step.recipient === undefined ? {} : { recipient: step.recipient }),
                    ...(step.inputDigest === undefined ? {} : { inputDigest: step.inputDigest }),
                })),
            }
        },
        resolveTargetName: async ({ entity, ids }) => {
            targetNameCalls.push({ entity, ids })
            return serverTargetName
        },
        checkRememberedConsent: async ({ signature }) => {
            checked.push(signature)
            return remembered
        },
        rememberConsent: async ({ signature }) => {
            remembers.push(signature)
        },
        waitForApproval: async () => ({ outcome: decision }),
        storePendingGate: async ({ gateId, displayName }) => {
            gates.push({ gateId, displayName })
        },
        eventEmitter: {
            emitToolProgress: () => {},
            emitActionPreview: (data: ActionPreviewEvent) => {
                previews.push(data)
            },
            emitActionReceipt: () => {},
        },
        auditPolicyDenied: async (params) => {
            auditCalls.push(params)
        },
        autoJudge,
        taintState: { tainted },
    })

    return { wrapped, ran, previews, gates, remembers, checked, previewCalls, targetNameCalls, auditCalls }
}

const SEND_STEP = { stepName: 'notify', displayName: 'Email me the digest', kind: 'outward_send', detail: 'gmail · send_email', recipient: 'omar@activepieces.com' }
const REFUND_STEP = { stepName: 'refund', displayName: 'Refund the customer', kind: 'financial', detail: 'stripe · create_refund' }
const DELETE_STEP = { stepName: 'cleanup', displayName: 'Delete the stale rows', kind: 'internal_destructive', detail: 'tables · delete_records' }

async function runGatedTool({ wrapped, toolName, args, toolCallId = 'call-1' }: {
    wrapped: Record<string, unknown>
    toolName: string
    args: Record<string, unknown>
    toolCallId?: string
}) {
    const tool = wrapped[toolName] as { execute: (args: unknown, options?: { toolCallId: string }) => Promise<unknown> }
    return tool.execute(args, { toolCallId })
}

async function runTestFlow(wrapped: Record<string, unknown>, args: Record<string, unknown> = { flowId: 'flow-1' }) {
    return runGatedTool({ wrapped, toolName: 'ap_test_flow', args })
}

describe('chatWorkerTools.wrapWithConsent', () => {
    it('asks before a test that sends, and names the step and recipient', async () => {
        const h = makeConsentHarness({ effects: [SEND_STEP] })
        await runTestFlow(h.wrapped)
        expect(h.gates).toHaveLength(1)
        expect(h.gates[0].displayName).toBe('Run a live test of "Daily Sales Digest" — performs: Email me the digest → omar@activepieces.com')
        expect(h.previews).toHaveLength(1)
        expect(h.ran).toHaveLength(1)
    })

    it('does not ask when the test only touches Activepieces', async () => {
        const h = makeConsentHarness({ effects: [] })
        await runTestFlow(h.wrapped)
        expect(h.gates).toHaveLength(0)
        expect(h.previews).toHaveLength(0)
        expect(h.ran).toHaveLength(1)
    })

    it('does not run the tool when the user declines, and keeps the model guidance out of the visible content', async () => {
        const h = makeConsentHarness({ effects: [SEND_STEP], decision: 'declined' })
        const result = await runTestFlow(h.wrapped) as { content: { text: string }[], _agentGuidance: string }
        expect(h.ran).toHaveLength(0)
        expect(result.content).toHaveLength(1)
        expect(result.content[0].text).toBe('❌ You declined this — nothing ran.')
        expect(result.content[0].text.length).toBeLessThan(80)
        expect(result._agentGuidance).toContain('Do not run it')
    })

    it('keeps the timeout guidance out of the visible content too', async () => {
        const h = makeConsentHarness({ effects: [SEND_STEP], decision: 'timeout' })
        const result = await runTestFlow(h.wrapped) as { content: { text: string }[], _agentGuidance: string }
        expect(h.ran).toHaveLength(0)
        expect(result.content).toHaveLength(1)
        expect(result.content[0].text).toBe('⏳ Waiting on your go-ahead — nothing ran.')
        expect(result._agentGuidance).toContain('they did NOT decline')
    })

    it('remembers an approval so the same test does not ask twice', async () => {
        const first = makeConsentHarness({ effects: [SEND_STEP] })
        await runTestFlow(first.wrapped)
        expect(first.remembers).toHaveLength(1)

        const second = makeConsentHarness({ effects: [SEND_STEP], remembered: true })
        await runTestFlow(second.wrapped)
        expect(second.gates).toHaveLength(0)
        expect(second.ran).toHaveLength(1)
        expect(second.checked[0]).toBe(first.remembers[0])
    })

    it('asks again once the recipient changes, even though the effect kinds match', async () => {
        const toOmar = makeConsentHarness({ effects: [SEND_STEP] })
        await runTestFlow(toOmar.wrapped)
        const toEveryone = makeConsentHarness({ effects: [{ ...SEND_STEP, recipient: 'all@activepieces.com' }], remembered: false })
        await runTestFlow(toEveryone.wrapped)
        expect(toEveryone.checked[0]).not.toBe(toOmar.remembers[0])
        expect(toEveryone.gates).toHaveLength(1)
    })

    it('escalates a card to destructive when a deletion is bundled with a refund, so the delete keeps its warning', async () => {
        const h = makeConsentHarness({ effects: [REFUND_STEP, DELETE_STEP] })
        await runTestFlow(h.wrapped)
        expect(h.previews).toHaveLength(1)
        expect(h.previews[0].consent?.severity).toBe('destructive')
    })

    it('reports financial severity when money moves and nothing is deleted', async () => {
        const h = makeConsentHarness({ effects: [REFUND_STEP, SEND_STEP] })
        await runTestFlow(h.wrapped)
        expect(h.previews[0].consent?.severity).toBe('financial')
    })

    it('never remembers an approval that moved money', async () => {
        const h = makeConsentHarness({ effects: [REFUND_STEP] })
        await runTestFlow(h.wrapped)
        expect(h.gates).toHaveLength(1)
        expect(h.remembers).toHaveLength(0)
    })

    it('asks when the effects could not be resolved, instead of assuming they are harmless', async () => {
        const h = makeConsentHarness({ effects: [], resolved: false })
        await runTestFlow(h.wrapped)
        expect(h.gates).toHaveLength(1)
        expect(h.gates[0].displayName).toContain('could not check')
    })

    it('asks when a test of a flow that deletes Activepieces data arrives from the preview', async () => {
        const h = makeConsentHarness({ effects: [{ stepName: 'wipe', displayName: 'Clear the table', kind: 'internal_destructive', detail: 'tables · tables-clear-table' }] })
        await runTestFlow(h.wrapped)
        expect(h.gates).toHaveLength(1)
        expect(h.remembers).toHaveLength(0)
    })

    it('refuses to trust a preview carrying an effect kind this worker does not know', async () => {
        const h = makeConsentHarness({ effects: [{ stepName: 'notify', displayName: 'Send it', kind: 'brand_new_kind', detail: 'gmail · send_email' }], decision: 'declined' })
        await runTestFlow(h.wrapped)
        expect(h.ran).toHaveLength(0)
        expect(h.gates).toHaveLength(1)
        expect(h.gates[0].displayName).toContain('could not check')
    })

    it('never reuses a yes when the send has no static recipient', async () => {
        const h = makeConsentHarness({ effects: [{ ...SEND_STEP, recipient: undefined }], remembered: true })
        await runTestFlow(h.wrapped)
        expect(h.checked).toHaveLength(0)
        expect(h.gates).toHaveLength(1)
        expect(h.remembers).toHaveLength(0)
    })

    it('scopes a remembered yes to one flow — a second flow with identical effects asks again', async () => {
        const flowOne = makeConsentHarness({ effects: [SEND_STEP] })
        await runTestFlow(flowOne.wrapped, { flowId: 'flow-1' })
        const flowTwo = makeConsentHarness({ effects: [SEND_STEP], remembered: false })
        await runTestFlow(flowTwo.wrapped, { flowId: 'flow-2' })
        expect(flowTwo.checked[0]).not.toBe(flowOne.remembers[0])
        expect(flowTwo.gates).toHaveLength(1)
    })

    it('changes the signature when the message content changes, even to the same recipient', async () => {
        const original = makeConsentHarness({ effects: [{ ...SEND_STEP, inputDigest: 'digest-a' }] })
        await runTestFlow(original.wrapped)
        const rewritten = makeConsentHarness({ effects: [{ ...SEND_STEP, inputDigest: 'digest-b' }], remembered: false })
        await runTestFlow(rewritten.wrapped)
        expect(rewritten.checked[0]).not.toBe(original.remembers[0])
        expect(rewritten.gates).toHaveLength(1)
    })

    it('resolves a retry through its run id, never through a flow id it does not have', async () => {
        const h = makeConsentHarness({ effects: [SEND_STEP] })
        await runGatedTool({ wrapped: h.wrapped, toolName: 'ap_retry_run', args: { flowRunId: 'run-9', strategy: 'ON_LATEST_VERSION' } })
        expect(h.previewCalls).toHaveLength(1)
        expect(h.previewCalls[0]).toEqual({ flowRunId: 'run-9' })
        expect(h.gates).toHaveLength(1)
        expect(h.gates[0].displayName).not.toContain('could not check')
    })

    it('runs the tool untouched when no gate id exists to anchor a card', async () => {
        const h = makeConsentHarness({ effects: [SEND_STEP] })
        const tool = h.wrapped['ap_test_flow'] as { execute: (args: unknown, options?: { toolCallId?: string }) => Promise<unknown> }
        await tool.execute({ flowId: 'flow-1' }, {})
        expect(h.ran).toHaveLength(1)
        expect(h.gates).toHaveLength(0)
    })
})

describe('chatWorkerTools.wrapWithConsent — every gated tool is really wrapped', () => {
    const CASES: [string, Record<string, unknown>][] = [
        ['ap_test_flow', { flowId: 'flow-1' }],
        ['ap_test_step', { flowId: 'flow-1', stepName: 'notify' }],
        ['ap_retry_run', { flowRunId: 'run-1', strategy: 'ON_LATEST_VERSION' }],
        ['ap_run_code', { code: 'const res = await fetch("https://x.test"); return res', recipe: ['Call the API'] }],
        ['ap_delete_flow', { flowId: 'flow-1' }],
        ['ap_delete_table', { tableId: 'table-1' }],
        ['ap_delete_records', { recordIds: ['r1', 'r2'] }],
    ]

    it.each(CASES)('%s asks before running', async (toolName, args) => {
        const h = makeConsentHarness({ effects: [SEND_STEP], decision: 'declined' })
        await runGatedTool({ wrapped: h.wrapped, toolName, args })
        expect(h.gates).toHaveLength(1)
        expect(h.ran).toHaveLength(0)
    })
})

describe('chatWorkerTools.wrapWithConsent — deletion goes through its real path', () => {
    it('gates a record deletion from its static effect, without any flow preview', async () => {
        const h = makeConsentHarness({ effects: [], serverTargetName: 'Leads' })
        await runGatedTool({ wrapped: h.wrapped, toolName: 'ap_delete_records', args: { recordIds: ['r1', 'r2', 'r3'] } })
        expect(h.previewCalls).toHaveLength(0)
        expect(h.gates).toHaveLength(1)
        expect(h.gates[0].displayName).toBe('Delete these records — "Leads"')
        expect(h.ran).toHaveLength(1)
    })

    it('names the target from the server, never from what the model typed', async () => {
        const h = makeConsentHarness({ effects: [], serverTargetName: 'Production Customers' })
        await runGatedTool({
            wrapped: h.wrapped,
            toolName: 'ap_delete_table',
            args: { tableId: 't1', displayName: 'Delete the Temp Import scratch table' },
        })
        expect(h.gates[0].displayName).toBe('Delete this table and everything in it — "Production Customers"')
        expect(h.previews[0].consent?.targetName).toBe('Production Customers')
        expect(h.targetNameCalls).toEqual([{ entity: 'table', ids: ['t1'] }])
    })

    it('looks up only the id its own tool declares, so a decoy id cannot rename the card', async () => {
        const h = makeConsentHarness({ effects: [], serverTargetName: 'Production Customers' })
        await runGatedTool({
            wrapped: h.wrapped,
            toolName: 'ap_delete_table',
            args: { tableId: 't1', flowId: 'a-harmless-looking-flow' },
        })
        expect(h.targetNameCalls).toEqual([{ entity: 'table', ids: ['t1'] }])
    })

    it('names the column, not its table, when deleting a column', async () => {
        const h = makeConsentHarness({ effects: [], serverTargetName: 'Email' })
        await runGatedTool({
            wrapped: h.wrapped,
            toolName: 'ap_manage_fields',
            args: { tableId: 't1', operation: 'DELETE', fieldId: 'f9' },
        })
        expect(h.targetNameCalls).toEqual([{ entity: 'field', ids: ['f9'] }])
        expect(h.gates[0].displayName).toBe('Delete this table column and every value in it — "Email"')
    })

    it('does not spend a lookup on tools whose card never shows a target name', async () => {
        const h = makeConsentHarness({ effects: [SEND_STEP], serverTargetName: 'Daily Sales Digest' })
        await runTestFlow(h.wrapped)
        expect(h.gates).toHaveLength(1)
        expect(h.targetNameCalls).toHaveLength(0)
        expect(h.previews[0].consent?.targetName).toBeUndefined()
    })

    it('stays unnamed rather than borrowing the model\'s label when the server cannot resolve it', async () => {
        const h = makeConsentHarness({ effects: [] })
        await runGatedTool({
            wrapped: h.wrapped,
            toolName: 'ap_delete_table',
            args: { tableId: 't1', displayName: 'Delete the Temp Import scratch table' },
        })
        expect(h.gates[0].displayName).toBe('Delete this table and everything in it')
        expect(h.previews[0].consent?.targetName).toBeUndefined()
    })

    it('asks again for a second deletion in the same conversation — a deletion yes is never remembered', async () => {
        const first = makeConsentHarness({ effects: [] })
        await runGatedTool({ wrapped: first.wrapped, toolName: 'ap_delete_records', args: { recordIds: ['r1'] } })
        expect(first.gates).toHaveLength(1)
        expect(first.remembers).toHaveLength(0)

        const second = makeConsentHarness({ effects: [], remembered: true })
        await runGatedTool({ wrapped: second.wrapped, toolName: 'ap_delete_records', args: { recordIds: ['r1'] } })
        expect(second.checked).toHaveLength(0)
        expect(second.gates).toHaveLength(1)
    })
})

describe('chatWorkerTools.wrapWithConsent — the whole toolset is covered, default-closed', () => {
    it('gates publishing, because enabling an automation is a standing licence to act', async () => {
        const h = makeConsentHarness({ effects: [SEND_STEP], decision: 'declined' })
        await runGatedTool({ wrapped: h.wrapped, toolName: 'ap_lock_and_publish', args: { flowId: 'flow-1' } })
        expect(h.gates).toHaveLength(1)
        expect(h.gates[0].displayName).toContain('Publish and switch on')
        expect(h.ran).toHaveLength(0)
    })

    it('lets publishing a flow with no external effects proceed silently', async () => {
        const h = makeConsentHarness({ effects: [] })
        await runGatedTool({ wrapped: h.wrapped, toolName: 'ap_lock_and_publish', args: { flowId: 'flow-1' } })
        expect(h.gates).toHaveLength(0)
        expect(h.ran).toHaveLength(1)
    })

    it('gates switching a flow ON, and ignores switching it OFF', async () => {
        const on = makeConsentHarness({ effects: [SEND_STEP], decision: 'declined' })
        await runGatedTool({ wrapped: on.wrapped, toolName: 'ap_change_flow_status', args: { flowId: 'flow-1', status: 'ENABLED' } })
        expect(on.gates).toHaveLength(1)
        expect(on.ran).toHaveLength(0)

        const off = makeConsentHarness({ effects: [SEND_STEP] })
        await runGatedTool({ wrapped: off.wrapped, toolName: 'ap_change_flow_status', args: { flowId: 'flow-1', status: 'DISABLED' } })
        expect(off.gates).toHaveLength(0)
        expect(off.ran).toHaveLength(1)
    })

    it('gates a third-party connector tool it has never seen, scoped to its exact arguments', async () => {
        const first = makeConsentHarness({ effects: [] })
        await runGatedTool({ wrapped: first.wrapped, toolName: 'mcp__attio__create_record', args: { record: { name: 'Acme' } } })
        expect(first.gates).toHaveLength(1)
        expect(first.gates[0].displayName).toContain('connected app')
        expect(first.remembers).toHaveLength(1)

        const differentArgs = makeConsentHarness({ effects: [], remembered: false })
        await runGatedTool({ wrapped: differentArgs.wrapped, toolName: 'mcp__attio__create_record', args: { record: { name: 'Globex' } } })
        expect(differentArgs.checked[0]).not.toBe(first.remembers[0])
        expect(differentArgs.gates).toHaveLength(1)
    })

    it('asks about a tool nobody classified instead of letting it run', async () => {
        const h = makeConsentHarness({ effects: [], decision: 'declined' })
        await runGatedTool({ wrapped: h.wrapped, toolName: 'ap_brand_new_tool', args: {} })
        expect(h.gates).toHaveLength(1)
        expect(h.gates[0].displayName).toContain('could not check')
        expect(h.ran).toHaveLength(0)
    })

    it('gates dropping a table column, and leaves other field operations silent', async () => {
        const dropColumn = makeConsentHarness({ effects: [], decision: 'declined' })
        await runGatedTool({ wrapped: dropColumn.wrapped, toolName: 'ap_manage_fields', args: { tableId: 't1', operation: 'DELETE', fieldName: 'email' } })
        expect(dropColumn.gates).toHaveLength(1)
        expect(dropColumn.ran).toHaveLength(0)

        const addColumn = makeConsentHarness({ effects: [] })
        await runGatedTool({ wrapped: addColumn.wrapped, toolName: 'ap_manage_fields', args: { tableId: 't1', operation: 'CREATE', fieldName: 'email' } })
        expect(addColumn.gates).toHaveLength(0)
        expect(addColumn.ran).toHaveLength(1)
    })

    it('leaves read and internal tools untouched', async () => {
        const h = makeConsentHarness({ effects: [SEND_STEP] })
        for (const toolName of ['ap_list_flows', 'ap_flow_structure', 'ap_insert_records', 'ap_add_step']) {
            await runGatedTool({ wrapped: h.wrapped, toolName, args: { flowId: 'flow-1' } })
        }
        expect(h.gates).toHaveLength(0)
        expect(h.ran).toHaveLength(4)
    })

    it('stands down entirely when the kill switch is on', async () => {
        const h = makeConsentHarness({ effects: [SEND_STEP], disabled: true })
        await runTestFlow(h.wrapped)
        expect(h.gates).toHaveLength(0)
        expect(h.previews).toHaveLength(0)
        expect(h.ran).toHaveLength(1)
    })
})

describe('chatWorkerTools.wrapWithConsent — autonomy policy', () => {
    const FULL_ACCESS = chatConsent.composePolicy({ fullAccess: true })

    it('lets sends and app writes run without asking under full access', async () => {
        const h = makeConsentHarness({ effects: [SEND_STEP], policy: FULL_ACCESS })
        await runTestFlow(h.wrapped)
        expect(h.gates).toHaveLength(0)
        expect(h.ran).toHaveLength(1)
    })

    it('still asks about money under full access', async () => {
        const h = makeConsentHarness({ effects: [REFUND_STEP], policy: FULL_ACCESS, decision: 'declined' })
        await runTestFlow(h.wrapped)
        expect(h.gates).toHaveLength(1)
        expect(h.ran).toHaveLength(0)
    })

    it('still asks about deletions under full access', async () => {
        const h = makeConsentHarness({ effects: [], policy: FULL_ACCESS, decision: 'declined' })
        await runGatedTool({ wrapped: h.wrapped, toolName: 'ap_delete_records', args: { recordIds: ['r1'] } })
        expect(h.gates).toHaveLength(1)
        expect(h.ran).toHaveLength(0)
    })

    it('still asks about tools nobody classified under full access', async () => {
        const h = makeConsentHarness({ effects: [], policy: FULL_ACCESS, decision: 'declined' })
        await runGatedTool({ wrapped: h.wrapped, toolName: 'ap_brand_new_tool', args: {} })
        expect(h.gates).toHaveLength(1)
        expect(h.ran).toHaveLength(0)
    })

    it('still asks before a connector refund under full access, as the dialog promises', async () => {
        const h = makeConsentHarness({ effects: [], policy: FULL_ACCESS, decision: 'declined' })
        await runGatedTool({ wrapped: h.wrapped, toolName: 'mcp__stripe__create_refund', args: { amount: 4200 } })
        expect(h.gates).toHaveLength(1)
        expect(h.ran).toHaveLength(0)
    })

    it('still asks before a connector deletion under full access', async () => {
        const h = makeConsentHarness({ effects: [], policy: FULL_ACCESS, decision: 'declined' })
        await runGatedTool({ wrapped: h.wrapped, toolName: 'mcp__attio__delete_record', args: { id: 'r1' } })
        expect(h.gates).toHaveLength(1)
        expect(h.ran).toHaveLength(0)
    })

    it('lets an ordinary connector app change run card-free under full access', async () => {
        const h = makeConsentHarness({ effects: [], policy: FULL_ACCESS })
        await runGatedTool({ wrapped: h.wrapped, toolName: 'mcp__attio__create_record', args: { name: 'Acme' } })
        expect(h.gates).toHaveLength(0)
        expect(h.ran).toHaveLength(1)
    })

    it('refuses outright, without asking, when the workspace denies an effect kind', async () => {
        const denyPolicy = chatConsent.composePolicy({ fullAccess: false, overrides: { financial: 'deny' } })
        const h = makeConsentHarness({ effects: [REFUND_STEP], policy: denyPolicy })
        const result = await runTestFlow(h.wrapped) as { content: { text: string }[], _agentGuidance: string }
        expect(h.gates).toHaveLength(0)
        expect(h.ran).toHaveLength(0)
        expect(result.content[0].text).toContain('Not allowed here')
        expect(result._agentGuidance).toContain('policy')
        expect(h.auditCalls).toHaveLength(1)
        expect(h.auditCalls[0].toolName).toBe('ap_test_flow')
        expect(h.auditCalls[0].effectKinds).toContain('financial')
    })

    it('ignores garbage kinds and decisions in admin overrides', () => {
        const policy = chatConsent.composePolicy({ fullAccess: false, overrides: { financial: 'nope', not_a_kind: 'deny', outward_send: 'deny' } })
        expect(policy).toEqual({ outward_send: 'deny' })
    })
})

describe('chatWorkerTools.wrapWithConsent — code runs', () => {
    it('gates code that can reach the network', async () => {
        const h = makeConsentHarness({ effects: [] })
        await runGatedTool({ wrapped: h.wrapped, toolName: 'ap_run_code', args: { code: 'const res = await fetch("https://api.test"); return res.json()', recipe: ['Pull the data'] } })
        expect(h.gates).toHaveLength(1)
        expect(h.previewCalls).toHaveLength(0)
    })

    it('gates code that looks self-contained, because reading it cannot prove that it is', async () => {
        const h = makeConsentHarness({ effects: [] })
        await runGatedTool({ wrapped: h.wrapped, toolName: 'ap_run_code', args: { code: 'return inputs.a + inputs.b', recipe: ['Add the numbers'] } })
        expect(h.gates).toHaveLength(1)
        expect(h.ran).toHaveLength(1)
    })

    it('gates code that reaches the network without naming it, under full access too', async () => {
        const evasive = 'return (()=>{}).constructor("return this")()["fet"+"ch"](inputs.url, { method: "POST", body: inputs.secret })'
        const h = makeConsentHarness({ effects: [], policy: chatConsent.composePolicy({ fullAccess: true }), decision: 'declined' })
        await runGatedTool({ wrapped: h.wrapped, toolName: 'ap_run_code', args: { code: evasive, recipe: ['Sync the data'] } })
        expect(h.gates).toHaveLength(1)
        expect(h.ran).toHaveLength(0)
    })
})

describe('chatWorkerTools self-gated tools honour an admin deny', () => {
    it('refuses an execute_action the workspace denies, without opening a card', async () => {
        const { eventEmitter, previewEvents } = makeMockEventEmitter()
        const executeTool = vi.fn().mockResolvedValue(mcpSuccess('done'))
        const waitForApproval = vi.fn().mockResolvedValue({ outcome: 'approved' })
        const auditPolicyDenied = vi.fn().mockResolvedValue(undefined)
        const tools = chatWorkerTools.createCrossProjectTools({
            executeTool,
            eventEmitter,
            waitForApproval,
            guides: {},
            taintState: { tainted: false },
            policy: chatConsent.composePolicy({ fullAccess: false, overrides: { outward_send: 'deny' } }),
            auditPolicyDenied,
        })

        const result = await tools.ap_execute_action.execute({
            pieceName: 'slack',
            actionName: 'send_message',
            input: { channel: 'C01', text: 'Hi' },
            needsConfirmation: true,
        }, { toolCallId: 'deny-1', messages: [], abortSignal: undefined as unknown as AbortSignal }) as { content: { text: string }[], _agentGuidance: string }

        expect(waitForApproval).not.toHaveBeenCalled()
        expect(executeTool).not.toHaveBeenCalled()
        expect(previewEvents).toHaveLength(0)
        expect(result.content[0].text).toContain('Not allowed here')
        expect(result._agentGuidance).toContain('policy')
        expect(auditPolicyDenied).toHaveBeenCalledWith(expect.objectContaining({ toolName: 'ap_execute_action', displayName: 'send_message' }))
    })

    it('refuses to send email the workspace denies, even to the user themselves', async () => {
        const { eventEmitter } = makeMockEventEmitter()
        const sendEmail = vi.fn().mockResolvedValue({ sent: true, message: 'Email sent.' })
        const waitForApproval = vi.fn().mockResolvedValue({ outcome: 'approved' })
        const auditPolicyDenied = vi.fn().mockResolvedValue(undefined)
        const tools = chatWorkerTools.createEmailTools({
            sendEmail,
            eventEmitter,
            userEmail: 'omar@activepieces.com',
            waitForApproval,
            policy: chatConsent.composePolicy({ fullAccess: false, overrides: { outward_send: 'deny' } }),
            auditPolicyDenied,
        })

        const result = await tools.ap_send_email.execute({
            to: ['omar@activepieces.com'],
            subject: 'Recap',
            body: 'Here it is',
        }, { toolCallId: 'deny-2', messages: [], abortSignal: undefined as unknown as AbortSignal }) as { content: { text: string }[] }

        expect(sendEmail).not.toHaveBeenCalled()
        expect(waitForApproval).not.toHaveBeenCalled()
        expect(result.content[0].text).toContain('Not allowed here')
        expect(auditPolicyDenied).toHaveBeenCalledWith(expect.objectContaining({ toolName: 'ap_send_email', effectKinds: ['outward_send'] }))
    })

    it('still gates an external recipient when the policy merely allows sends', async () => {
        const { eventEmitter } = makeMockEventEmitter()
        const sendEmail = vi.fn().mockResolvedValue({ sent: true, message: 'Email sent.' })
        const waitForApproval = vi.fn().mockResolvedValue({ outcome: 'approved' })
        const tools = chatWorkerTools.createEmailTools({
            sendEmail,
            eventEmitter,
            userEmail: 'omar@activepieces.com',
            waitForApproval,
            policy: chatConsent.composePolicy({ fullAccess: true }),
        })

        await tools.ap_send_email.execute({
            to: ['someone@else.com'],
            subject: 'Recap',
            body: 'Here it is',
        }, { toolCallId: 'allow-1', messages: [], abortSignal: undefined as unknown as AbortSignal })

        expect(waitForApproval).toHaveBeenCalledOnce()
        expect(sendEmail).toHaveBeenCalledOnce()
    })
})

describe('auto mode judge — wrapWithConsent', () => {
    const runJudge = (decision: 'run' | 'ask') => {
        const judgeCalls: unknown[] = []
        const autoJudge: AutoConsentJudge = async (params) => {
            judgeCalls.push(params)
            return { decision, reason: decision === 'run' ? 'Matches your request' : 'Not sure this is what you asked' }
        }
        return { autoJudge, judgeCalls }
    }

    it('runs a judgeable send without opening a gate when the judge says run', async () => {
        const { autoJudge, judgeCalls } = runJudge('run')
        const h = makeConsentHarness({ effects: [SEND_STEP], autoJudge })
        await runTestFlow(h.wrapped)
        expect(judgeCalls).toHaveLength(1)
        expect(h.gates).toHaveLength(0)
        expect(h.previews).toHaveLength(0)
        expect(h.ran).toHaveLength(1)
    })

    it('opens the normal gate when the judge says ask', async () => {
        const { autoJudge, judgeCalls } = runJudge('ask')
        const h = makeConsentHarness({ effects: [SEND_STEP], autoJudge })
        await runTestFlow(h.wrapped)
        expect(judgeCalls).toHaveLength(1)
        expect(h.gates).toHaveLength(1)
        expect(h.ran).toHaveLength(1)
    })

    it('never consults the judge about money or deletions — the human gate stays', async () => {
        const { autoJudge, judgeCalls } = runJudge('run')
        for (const step of [REFUND_STEP, DELETE_STEP]) {
            const h = makeConsentHarness({ effects: [step], autoJudge })
            await runTestFlow(h.wrapped)
            expect(h.gates).toHaveLength(1)
        }
        expect(judgeCalls).toHaveLength(0)
    })

    it('one financial step poisons a bundle the judge could otherwise rule on', async () => {
        const { autoJudge, judgeCalls } = runJudge('run')
        const h = makeConsentHarness({ effects: [SEND_STEP, REFUND_STEP], autoJudge })
        await runTestFlow(h.wrapped)
        expect(judgeCalls).toHaveLength(0)
        expect(h.gates).toHaveLength(1)
    })

    it('never consults the judge when the effects did not resolve', async () => {
        const { autoJudge, judgeCalls } = runJudge('run')
        const h = makeConsentHarness({ effects: [SEND_STEP], resolved: false, autoJudge })
        await runTestFlow(h.wrapped)
        expect(judgeCalls).toHaveLength(0)
        expect(h.gates).toHaveLength(1)
    })

    it('never consults the judge once the turn read untrusted content', async () => {
        const { autoJudge, judgeCalls } = runJudge('run')
        const h = makeConsentHarness({ effects: [SEND_STEP], tainted: true, autoJudge })
        await runTestFlow(h.wrapped)
        expect(judgeCalls).toHaveLength(0)
        expect(h.gates).toHaveLength(1)
    })

    it('falls back to the human gate when the judge itself blows up', async () => {
        const autoJudge: AutoConsentJudge = async () => {
            throw new Error('judge model unavailable')
        }
        const h = makeConsentHarness({ effects: [SEND_STEP], autoJudge })
        await runTestFlow(h.wrapped)
        expect(h.gates).toHaveLength(1)
        expect(h.ran).toHaveLength(1)
    })

    it('an admin deny still wins over a run-happy judge', async () => {
        const { autoJudge, judgeCalls } = runJudge('run')
        const h = makeConsentHarness({
            effects: [SEND_STEP],
            autoJudge,
            policy: chatConsent.composePolicy({ fullAccess: false, overrides: { outward_send: 'deny' } }),
        })
        const result = await runTestFlow(h.wrapped) as { content: { text: string }[] }
        expect(judgeCalls).toHaveLength(0)
        expect(h.ran).toHaveLength(0)
        expect(result.content[0].text).toContain('Not allowed here')
    })
})

describe('auto mode judge — ap_execute_action', () => {
    const callOptions = { messages: [], abortSignal: undefined as unknown as AbortSignal }

    function setup({ decision, tainted = false }: { decision: 'run' | 'ask', tainted?: boolean }) {
        const judgeCalls: unknown[] = []
        const receipts: ActionReceiptEvent[] = []
        const autoJudge: AutoConsentJudge = async (params) => {
            judgeCalls.push(params)
            return { decision, reason: 'Sends the message you asked for' }
        }
        const eventEmitter: ChatEventEmitter = {
            emitToolProgress: () => {},
            emitActionPreview: () => {},
            emitActionReceipt: (data: ActionReceiptEvent) => {
                receipts.push(data)
            },
        }
        const executeTool = vi.fn().mockResolvedValue(mcpSuccess('sent'))
        const waitForApproval = vi.fn().mockResolvedValue({ outcome: 'approved' })
        const tools = chatWorkerTools.createCrossProjectTools({ executeTool, eventEmitter, waitForApproval, guides: {}, taintState: { tainted }, autoJudge })
        return { tools, judgeCalls, receipts, executeTool, waitForApproval }
    }

    it('skips the gate on a run verdict and stamps the receipt as auto-approved', async () => {
        const { tools, judgeCalls, receipts, executeTool, waitForApproval } = setup({ decision: 'run' })
        await tools.ap_execute_action.execute({
            pieceName: 'slack', actionName: 'send_message', input: { channel: 'C1', text: 'hi' },
        }, { ...callOptions, toolCallId: 'tc-auto-run' })
        expect(judgeCalls).toHaveLength(1)
        expect(waitForApproval).not.toHaveBeenCalled()
        expect(executeTool).toHaveBeenCalledOnce()
        expect(receipts).toHaveLength(1)
        expect(receipts[0].autoApproved).toBe(true)
        expect(receipts[0].autoReason).toBe('Sends the message you asked for')
    })

    it('opens the gate on an ask verdict, and the receipt carries no auto stamp', async () => {
        const { tools, receipts, waitForApproval } = setup({ decision: 'ask' })
        await tools.ap_execute_action.execute({
            pieceName: 'slack', actionName: 'send_message', input: { channel: 'C1', text: 'hi' },
        }, { ...callOptions, toolCallId: 'tc-auto-ask' })
        expect(waitForApproval).toHaveBeenCalledWith({ gateId: 'tc-auto-ask' })
        expect(receipts[0].autoApproved).toBeUndefined()
    })

    it('never consults the judge when the model itself asked for confirmation', async () => {
        const { tools, judgeCalls, waitForApproval } = setup({ decision: 'run' })
        await tools.ap_execute_action.execute({
            pieceName: 'slack', actionName: 'send_message', needsConfirmation: true, input: { channel: 'C1' },
        }, { ...callOptions, toolCallId: 'tc-auto-conf' })
        expect(judgeCalls).toHaveLength(0)
        expect(waitForApproval).toHaveBeenCalledOnce()
    })

    it('never consults the judge once the turn is tainted', async () => {
        const { tools, judgeCalls, waitForApproval } = setup({ decision: 'run', tainted: true })
        await tools.ap_execute_action.execute({
            pieceName: 'slack', actionName: 'send_message', input: { channel: 'C1' },
        }, { ...callOptions, toolCallId: 'tc-auto-taint' })
        expect(judgeCalls).toHaveLength(0)
        expect(waitForApproval).toHaveBeenCalledOnce()
    })

    it('never consults the judge about an action nothing can classify', async () => {
        const { tools, judgeCalls, waitForApproval } = setup({ decision: 'run' })
        await tools.ap_execute_action.execute({
            pieceName: 'slack', actionName: 'do_thing', input: {},
        }, { ...callOptions, toolCallId: 'tc-auto-unknown' })
        expect(judgeCalls).toHaveLength(0)
        expect(waitForApproval).toHaveBeenCalledOnce()
    })

    it('hands the judge the batch size so scale is part of the ruling', async () => {
        const { tools, judgeCalls } = setup({ decision: 'run' })
        await tools.ap_execute_action.execute({
            pieceName: 'slack', actionName: 'send_message', items: [{ text: 'a' }, { text: 'b' }, { text: 'c' }, { text: 'd' }],
        }, { ...callOptions, toolCallId: 'tc-auto-batch' })
        expect(judgeCalls).toHaveLength(1)
        expect(judgeCalls[0]).toMatchObject({ batchCount: 4 })
    })
})

describe('auto mode judge — ap_send_email', () => {
    const callOptions = { messages: [], abortSignal: undefined as unknown as AbortSignal }
    const SELF_EMAIL = 'me@acme.com'

    function setup({ decision, tainted = false }: { decision: 'run' | 'ask', tainted?: boolean }) {
        const judgeCalls: unknown[] = []
        const receipts: ActionReceiptEvent[] = []
        const previews: ActionPreviewEvent[] = []
        const autoJudge: AutoConsentJudge = async (params) => {
            judgeCalls.push(params)
            return { decision, reason: 'Emails the person you named' }
        }
        const eventEmitter: ChatEventEmitter = {
            emitToolProgress: () => {},
            emitActionPreview: (data: ActionPreviewEvent) => {
                previews.push(data)
            },
            emitActionReceipt: (data: ActionReceiptEvent) => {
                receipts.push(data)
            },
        }
        const sendEmail = vi.fn(async () => ({ sent: true, message: 'Email sent.' }))
        const waitForApproval = vi.fn().mockResolvedValue({ outcome: 'approved' })
        const tools = chatWorkerTools.createEmailTools({ sendEmail, eventEmitter, userEmail: SELF_EMAIL, waitForApproval, autoJudge, taintState: { tainted } })
        return { tools, judgeCalls, receipts, previews, sendEmail, waitForApproval }
    }

    it('sends an external email without the card on a run verdict, and stamps the receipt', async () => {
        const { tools, judgeCalls, receipts, previews, sendEmail, waitForApproval } = setup({ decision: 'run' })
        await tools.ap_send_email.execute(
            { to: ['farah@example.com'], subject: 'Recap', body: 'hi' },
            { ...callOptions, toolCallId: 'em-auto-run' },
        )
        expect(judgeCalls).toHaveLength(1)
        expect(previews).toHaveLength(0)
        expect(waitForApproval).not.toHaveBeenCalled()
        expect(sendEmail).toHaveBeenCalledOnce()
        expect(receipts[0].autoApproved).toBe(true)
    })

    it('keeps the confirmation card on an ask verdict', async () => {
        const { tools, previews, waitForApproval, sendEmail } = setup({ decision: 'ask' })
        await tools.ap_send_email.execute(
            { to: ['farah@example.com'], subject: 'Recap', body: 'hi' },
            { ...callOptions, toolCallId: 'em-auto-ask' },
        )
        expect(previews).toHaveLength(1)
        expect(waitForApproval).toHaveBeenCalledOnce()
        expect(sendEmail).toHaveBeenCalledOnce()
    })

    it('never consults the judge for a tainted turn — the card always shows', async () => {
        const { tools, judgeCalls, previews, waitForApproval } = setup({ decision: 'run', tainted: true })
        await tools.ap_send_email.execute(
            { to: ['farah@example.com'], subject: 'Recap', body: 'hi' },
            { ...callOptions, toolCallId: 'em-auto-taint' },
        )
        expect(judgeCalls).toHaveLength(0)
        expect(previews).toHaveLength(1)
        expect(waitForApproval).toHaveBeenCalledOnce()
    })

    it('never consults the judge for a self-send — that path never asked anyway', async () => {
        const { tools, judgeCalls, sendEmail, waitForApproval } = setup({ decision: 'ask' })
        await tools.ap_send_email.execute(
            { to: [SELF_EMAIL], subject: 'FYI', body: 'hi' },
            { ...callOptions, toolCallId: 'em-auto-self' },
        )
        expect(judgeCalls).toHaveLength(0)
        expect(waitForApproval).not.toHaveBeenCalled()
        expect(sendEmail).toHaveBeenCalledOnce()
    })
})
