import { tool } from 'ai'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { runMetrics } from './run-metrics'

describe('runMetrics.summarize', () => {
    const usage = (input: number, cached: number, output: number, reasoning: number) => ({
        inputTokens: { total: input, noCache: input - cached, cacheRead: cached, cacheWrite: undefined },
        outputTokens: { total: output, text: output - reasoning, reasoning },
    })
    const ok = { content: [{ type: 'text', text: '✅ done' }] }

    it('adds up tokens and model time and counts wasted tool calls', () => {
        const metrics = runMetrics.summarize({
            modelCalls: [{ durationMs: 1_000, usage: usage(100, 40, 20, 5) }, { durationMs: 2_000, usage: usage(200, 150, 30, 10) }],
            toolTimings: [
                { toolName: 'ap_get_piece_props', durationMs: 100, finishedAtMs: 1_100, succeeded: true },
                { toolName: 'ap_build_flow', durationMs: 500, finishedAtMs: 4_000, succeeded: true },
            ],
            toolCalls: [
                { toolName: 'ap_get_piece_props', input: { pieceName: 'slack' }, output: ok },
                { toolName: 'ap_get_piece_props', input: { pieceName: 'slack' }, output: ok },
                { toolName: 'ap_build_flow', input: { flowName: 'x' }, output: ok },
                { toolName: 'ap_update_step', input: { stepName: 'step_1' }, output: ok },
            ],
            rejectedToolCalls: 1,
            totalMs: 9_000,
        })

        expect(metrics).toMatchObject({
            totalMs: 9_000,
            modelCalls: 2,
            modelMs: 3_000,
            toolMs: 600,
            inputTokens: 300,
            cachedInputTokens: 190,
            outputTokens: 50,
            reasoningTokens: 15,
            toolCalls: 4,
            toolCallsByName: { ap_get_piece_props: 2, ap_build_flow: 1, ap_update_step: 1 },
            wasted: { rejectedInputs: 1, repeatedPieceProps: 1, fixRoundsAfterBuild: 1 },
            firstBuildMs: 4_000,
        })
    })

    it('counts flow-operation and branch edits after a build as fixes and tolerates calls without usage', () => {
        const metrics = runMetrics.summarize({
            modelCalls: [{ durationMs: 500, usage: null }],
            toolTimings: [{ toolName: 'ap_build_flow', durationMs: 10, finishedAtMs: 10, succeeded: true }],
            toolCalls: [
                { toolName: 'ap_build_flow', input: {}, output: ok },
                { toolName: 'ap_apply_flow_operations', input: {}, output: ok },
                { toolName: 'ap_update_branch', input: {}, output: ok },
            ],
            rejectedToolCalls: 0,
            totalMs: 100,
        })

        expect(metrics.wasted.fixRoundsAfterBuild).toBe(2)
        expect(metrics).toMatchObject({ modelCalls: 1, modelMs: 500, inputTokens: null, outputTokens: null })
    })

    it('does not count edits before a build succeeds as fixes', () => {
        const failed = { content: [{ type: 'text', text: '❌ Flow failed' }], isError: true }
        const metrics = runMetrics.summarize({
            modelCalls: [],
            toolTimings: [{ toolName: 'ap_build_flow', durationMs: 10, finishedAtMs: 10, succeeded: false }],
            toolCalls: [{ toolName: 'ap_build_flow', input: {}, output: failed }, { toolName: 'ap_update_step', input: {}, output: ok }],
            rejectedToolCalls: 0,
            totalMs: 100,
        })

        expect(metrics.wasted.fixRoundsAfterBuild).toBe(0)
        expect(metrics.firstBuildMs).toBeNull()
    })
})

describe('runMetrics.createRecorder', () => {
    it('counts the time of a tool that throws as a failed call and rethrows', async () => {
        vi.spyOn(Date, 'now').mockReturnValueOnce(1_000).mockReturnValueOnce(1_000).mockReturnValueOnce(1_250).mockReturnValueOnce(1_300)
        const recorder = runMetrics.createRecorder()
        const failure = new Error('dev server down')
        const tools = recorder.timeTools({
            ap_build_flow: tool({
                inputSchema: z.object({}),
                execute: async () => {
                    throw failure
                },
            }),
        })

        await expect(tools['ap_build_flow'].execute?.({}, { toolCallId: 't1', messages: [], context: {} })).rejects.toBe(failure)

        const metrics = recorder.summarize({ toolCalls: [], rejectedToolCalls: 0 })
        expect(metrics).toMatchObject({ totalMs: 300, toolMs: 250, firstBuildMs: null })
        vi.restoreAllMocks()
    })
})
