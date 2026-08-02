import { describe, expect, it } from 'vitest'
import { ChatEvalRecordedToolCall } from './fixture'
import { replayExecutor } from './replay-executor'

const recorded: ChatEvalRecordedToolCall[] = [
    { order: 0, toolName: 'ap_research_pieces', output: { pieces: ['gmail'] } },
    { order: 1, toolName: 'ap_build_flow', output: { flowId: 'flow-1' } },
]

describe('replayExecutor', () => {
    it('replays recorded outputs in call order', async () => {
        const replay = replayExecutor.create({ recordedToolCalls: recorded })
        expect(await replay.executeTool('ap_research_pieces', {})).toEqual({ pieces: ['gmail'] })
        expect(await replay.executeTool('ap_build_flow', {})).toEqual({ flowId: 'flow-1' })
        expect(replay.getDivergences()).toEqual([])
    })

    it('sorts by order regardless of array order', async () => {
        const replay = replayExecutor.create({ recordedToolCalls: [recorded[1], recorded[0]] })
        expect(await replay.executeTool('ap_research_pieces', {})).toEqual({ pieces: ['gmail'] })
    })

    it('records a divergence and returns a sentinel when the agent calls a different tool', async () => {
        const replay = replayExecutor.create({ recordedToolCalls: recorded })
        const out = await replay.executeTool('ap_test_flow', {})
        expect(out).toMatchObject({ __evalDivergence: true, toolName: 'ap_test_flow', position: 0 })
        const divergences = replay.getDivergences()
        expect(divergences).toHaveLength(1)
        expect(divergences[0]).toMatchObject({ position: 0, expectedTool: 'ap_research_pieces', actualTool: 'ap_test_flow' })
    })

    it('records a divergence when the agent makes more calls than recorded', async () => {
        const replay = replayExecutor.create({ recordedToolCalls: [recorded[0]] })
        await replay.executeTool('ap_research_pieces', {})
        const out = await replay.executeTool('ap_build_flow', {})
        expect(out).toMatchObject({ __evalDivergence: true })
        expect(replay.getDivergences()[0]).toMatchObject({ position: 1, expectedTool: null, actualTool: 'ap_build_flow' })
    })
})
