import { FlowActionType, GenericStepOutput, LoopStepOutput, StepOutputStatus, StepOutputType } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { FlowExecutorContext } from '../../../src/lib/handler/context/flow-execution-context'
import { sizeofUtils } from '../../../src/lib/helper/sizeof'

function pieceStep(output: unknown): GenericStepOutput<FlowActionType.PIECE, unknown> {
    return GenericStepOutput.create({
        type: FlowActionType.PIECE,
        status: StepOutputStatus.SUCCEEDED,
        input: { key: 'value' },
    }).setOutput(output)
}

describe('FlowExecutorContext.logSizeBytes', () => {
    it('starts at the size of an empty steps record', () => {
        const ctx = FlowExecutorContext.empty()
        expect(ctx.logSizeBytes).toBe(sizeofUtils.recursiveSizeof(ctx.steps))
    })

    it('matches a full recursive walk across inserts, overwrites and nested loop steps', async () => {
        let ctx = FlowExecutorContext.empty()

        ctx = await ctx.upsertStep('trigger', pieceStep({ payload: 'x'.repeat(100) }))
        ctx = await ctx.upsertStep('trigger', pieceStep({ payload: 'tiny' }))

        let loopOutput = LoopStepOutput.init({ input: { items: [1, 2] } })
        ctx = await ctx.upsertStep('loop', loopOutput)

        for (let iteration = 0; iteration < 2; iteration++) {
            loopOutput = loopOutput.setItemAndIndex({ item: iteration, index: iteration + 1 }).addIteration()
            ctx = (await ctx.upsertStep('loop', loopOutput))
                .setCurrentPath(ctx.currentPath.loopIteration({ loopName: 'loop', iteration }))
            ctx = await ctx.upsertStep('inner', pieceStep({ nested: ['a', 'b', iteration] }))
            ctx = await ctx.upsertStep('inner', pieceStep({ nested: 'overwritten'.repeat(iteration + 1) }))
            ctx = ctx.setCurrentPath(ctx.currentPath.removeLast())
        }

        ctx = await ctx.upsertStep('last', pieceStep(undefined))

        expect(ctx.logSizeBytes).toBe(sizeofUtils.recursiveSizeof(ctx.steps))
    })

    it('counts the referenced size of sliced steps, not the ref payload', async () => {
        const sliced = new GenericStepOutput({
            type: FlowActionType.CODE,
            status: StepOutputStatus.SUCCEEDED,
            input: {},
            outputType: StepOutputType.SLICE,
            output: { fileId: 'file-1', size: 4_096, url: 'http://example.com/file-1' },
        })

        const ctx = await FlowExecutorContext.empty().upsertStep('echo_step', sliced)

        expect(ctx.logSizeBytes).toBe(sizeofUtils.recursiveSizeof(ctx.steps))
        expect(ctx.logSizeBytes).toBeGreaterThan(4_096)
    })

    it('stays exact when a growing loop is upserted the way the loop executor does it', async () => {
        let ctx = await FlowExecutorContext.empty().upsertStep('loop', LoopStepOutput.init({ input: { items: [] } }))

        for (let iteration = 0; iteration < 200; iteration++) {
            const current = ctx.getLoopStepOutput({ stepName: 'loop' }) ?? LoopStepOutput.init({ input: { items: [] } })
            const next = current.setItemAndIndex({ item: { id: iteration }, index: iteration + 1 }).addIteration()
            ctx = (await ctx.upsertStep('loop', next))
                .setCurrentPath(ctx.currentPath.loopIteration({ loopName: 'loop', iteration }))
            ctx = await ctx.upsertStep('router', pieceStep({ branch: iteration % 2 === 0 ? 'a' : 'fallback' }))
            ctx = ctx.setCurrentPath(ctx.currentPath.removeLast())
        }

        expect(ctx.logSizeBytes).toBe(sizeofUtils.recursiveSizeof(ctx.steps))
    })

    it('stays exact when a step flips between a slice ref and an inline output', async () => {
        const sliced = new GenericStepOutput({
            type: FlowActionType.CODE,
            status: StepOutputStatus.SUCCEEDED,
            input: {},
            outputType: StepOutputType.SLICE,
            output: { fileId: 'file-1', size: 8_192, url: 'http://example.com/file-1' },
        })

        let ctx = await FlowExecutorContext.empty().upsertStep('echo_step', sliced)
        ctx = await ctx.upsertStep('echo_step', pieceStep({ small: 'inline' }))
        ctx = await ctx.upsertStep('echo_step', sliced)

        expect(ctx.logSizeBytes).toBe(sizeofUtils.recursiveSizeof(ctx.steps))
    })
})
