import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { FlowActionType, GenericStepOutput, LoopStepOutput, StepOutputStatus } from '@activepieces/shared'
import { FlowExecutorContext } from '../../../src/lib/handler/context/flow-execution-context'
import { runStateStore } from '../../../src/lib/helper/run-state-store'

function makePieceStep(output: unknown): GenericStepOutput<FlowActionType.PIECE, unknown> {
    return GenericStepOutput.create({
        type: FlowActionType.PIECE,
        status: StepOutputStatus.SUCCEEDED,
        input: {},
        output,
    })
}

describe('FlowExecutorContext with runStateStore', () => {
    beforeAll(() => {
        process.env.AP_FLOWS_CACHE_PATH = fs.mkdtempSync(path.join(os.tmpdir(), 'flow-context-store-test-'))
    })

    beforeEach(() => {
        runStateStore.init({ runId: 'test-run-id', flowVersionId: 'test-flow-version-id' })
    })

    afterEach(() => {
        runStateStore.dispose()
    })

    test('upsertStep strips the output from in-memory steps and getStepOutput reads it back from the store', async () => {
        const ctx = await FlowExecutorContext.empty().upsertStep('step_1', makePieceStep({ big: 'value' }))
        expect(ctx.steps.step_1.output).toBeUndefined()
        expect(ctx.getStepOutput('step_1')?.output).toEqual({ big: 'value' })
    })

    test('upsertStep keeps the output in memory when the store is not initialized', async () => {
        runStateStore.dispose()
        const ctx = await FlowExecutorContext.empty().upsertStep('step_1', makePieceStep({ big: 'value' }))
        expect(ctx.steps.step_1.output).toEqual({ big: 'value' })
        expect(ctx.getStepOutput('step_1')?.output).toEqual({ big: 'value' })
    })

    test('currentState returns only referenced step outputs, read from the store', async () => {
        let ctx = FlowExecutorContext.empty()
        ctx = await ctx.upsertStep('step_1', makePieceStep({ value: 1 }))
        ctx = await ctx.upsertStep('step_2', makePieceStep({ value: 2 }))

        const state = await ctx.currentState(['step_2'])

        expect(state).toEqual({ step_2: { output: { value: 2 }, error: undefined } })
    })

    test('currentState inside a loop iteration exposes the loop view and iteration steps', async () => {
        let ctx = FlowExecutorContext.empty()
        const loop = LoopStepOutput.init({ input: {} }).setItemAndIndex({ item: 'a', index: 1 }).addIteration()
        ctx = await ctx.upsertStep('loop_1', loop)
        ctx = ctx.setCurrentPath(ctx.currentPath.loopIteration({ loopName: 'loop_1', iteration: 0 }))
        ctx = await ctx.upsertStep('inner_1', makePieceStep({ inner: true }))

        expect(ctx.getStepOutput('inner_1')?.output).toEqual({ inner: true })

        const state = await ctx.currentState(['loop_1', 'inner_1'])

        expect(state.inner_1).toEqual({ output: { inner: true }, error: undefined })
        expect(state.loop_1).toMatchObject({ output: { item: 'a', index: 1 } })
    })

    test('the same step name is isolated per loop iteration path', async () => {
        let ctx = FlowExecutorContext.empty()
        ctx = await ctx.upsertStep('step_1', makePieceStep({ scope: 'root' }))
        const loop = LoopStepOutput.init({ input: {} }).setItemAndIndex({ item: 'a', index: 1 }).addIteration()
        ctx = await ctx.upsertStep('loop_1', loop)
        ctx = ctx.setCurrentPath(ctx.currentPath.loopIteration({ loopName: 'loop_1', iteration: 0 }))
        ctx = await ctx.upsertStep('step_1', makePieceStep({ scope: 'loop' }))

        expect(ctx.getStepOutput('step_1')?.output).toEqual({ scope: 'loop' })
        expect(ctx.getStepOutput('step_1', [])?.output).toEqual({ scope: 'root' })
    })
})
