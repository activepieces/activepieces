import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { FlowActionType, GenericStepOutput, LoopStepOutput, StepOutputStatus, StepOutputType } from '@activepieces/shared'
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

function makeSliceStep(fileId: string): GenericStepOutput<FlowActionType.PIECE, unknown> {
    return new GenericStepOutput({
        type: FlowActionType.PIECE,
        status: StepOutputStatus.SUCCEEDED,
        input: {},
        output: { fileId, size: 123, url: `http://api/v1/files/${fileId}` },
        outputType: StepOutputType.SLICE,
    })
}

const ENGINE_API = { engineToken: 'token', internalApiUrl: 'http://api/' }

describe('FlowExecutorContext with runStateStore', () => {
    beforeAll(() => {
        process.env.AP_FLOWS_CACHE_PATH = fs.mkdtempSync(path.join(os.tmpdir(), 'flow-context-store-test-'))
    })

    beforeEach(() => {
        runStateStore.init({ runId: 'test-run-id' })
    })

    afterEach(() => {
        runStateStore.dispose()
    })

    test('upsertStep strips the output from in-memory steps and getStepOutput reads it back from the store', async () => {
        const ctx = await FlowExecutorContext.empty().upsertStep('step_1', makePieceStep({ big: 'value' }))
        expect(ctx.steps.step_1.output).toBeUndefined()
        expect(ctx.getStepOutput('step_1')?.output).toEqual({ big: 'value' })
    })

    test('upsertStep strips the input from in-memory steps and getStepOutput reads it back from the store', async () => {
        const step = GenericStepOutput.create({
            type: FlowActionType.PIECE,
            status: StepOutputStatus.SUCCEEDED,
            input: { first: 5, second: 2 },
            output: { result: 10 },
        })
        const ctx = await FlowExecutorContext.empty().upsertStep('step_1', step)
        expect(ctx.steps.step_1.input).toBeUndefined()
        expect(ctx.getStepOutput('step_1')?.input).toEqual({ first: 5, second: 2 })
    })

    test('upsertStep keeps the output in memory when the store is not initialized', async () => {
        runStateStore.dispose()
        const ctx = await FlowExecutorContext.empty().upsertStep('step_1', makePieceStep({ big: 'value' }))
        expect(ctx.steps.step_1.output).toEqual({ big: 'value' })
        expect(ctx.getStepOutput('step_1')?.output).toEqual({ big: 'value' })
    })

    test('getStepView reads the step view from the store and returns undefined for missing steps', async () => {
        let ctx = FlowExecutorContext.empty()
        ctx = await ctx.upsertStep('step_1', makePieceStep({ value: 1 }))
        ctx = await ctx.upsertStep('step_2', makePieceStep({ value: 2 }))

        expect(await ctx.getStepView('step_2')).toEqual({ output: { value: 2 }, error: undefined })
        expect(await ctx.getStepView('missing')).toBeUndefined()
    })

    test('getStepView exposes the failed step error message', async () => {
        const failed = GenericStepOutput.create({
            type: FlowActionType.PIECE,
            status: StepOutputStatus.FAILED,
            input: {},
            output: undefined,
        }).setErrorMessage('something broke')
        const ctx = await FlowExecutorContext.empty().upsertStep('step_1', failed)

        expect(await ctx.getStepView('step_1')).toEqual({ output: undefined, error: { message: 'something broke' } })
    })

    test('getStepView inside a loop iteration exposes the loop view and iteration steps', async () => {
        let ctx = FlowExecutorContext.empty()
        const loop = LoopStepOutput.init({ input: {} }).setItemAndIndex({ item: 'a', index: 1 }).addIteration()
        ctx = await ctx.upsertStep('loop_1', loop)
        ctx = ctx.setCurrentPath(ctx.currentPath.loopIteration({ loopName: 'loop_1', iteration: 0 }))
        ctx = await ctx.upsertStep('inner_1', makePieceStep({ inner: true }))

        expect(ctx.getStepOutput('inner_1')?.output).toEqual({ inner: true })
        expect(await ctx.getStepView('inner_1')).toEqual({ output: { inner: true }, error: undefined })
        expect(await ctx.getStepView('loop_1')).toMatchObject({ output: { item: 'a', index: 1 } })
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
        expect(await ctx.getStepView('step_1')).toEqual({ output: { scope: 'loop' }, error: undefined })
    })

    describe('slice materialization', () => {
        afterEach(() => {
            vi.unstubAllGlobals()
            vi.restoreAllMocks()
        })

        test('getStepView downloads a slice once and serves later reads from the store', async () => {
            const payload = { big: 'x'.repeat(100) }
            const fetchSpy = vi.fn().mockImplementation(async () => new Response(JSON.stringify(payload)))
            vi.stubGlobal('fetch', fetchSpy)

            let ctx = FlowExecutorContext.empty({ engineApi: ENGINE_API })
            ctx = await ctx.upsertStep('step_1', makeSliceStep('slice-1'))

            expect(await ctx.getStepView('step_1')).toEqual({ output: payload, error: undefined })
            expect(await ctx.getStepView('step_1')).toEqual({ output: payload, error: undefined })
            expect(fetchSpy).toHaveBeenCalledTimes(1)
            expect(runStateStore.getSliceJson({ fileId: 'slice-1' })).toEqual(JSON.stringify(payload))
        })

        test('concurrent reads of the same slice share one in-flight download', async () => {
            const payload = { value: 42 }
            const fetchSpy = vi.fn().mockImplementation(async () => new Response(JSON.stringify(payload)))
            vi.stubGlobal('fetch', fetchSpy)

            let ctx = FlowExecutorContext.empty({ engineApi: ENGINE_API })
            ctx = await ctx.upsertStep('step_1', makeSliceStep('slice-2'))

            const [first, second] = await Promise.all([ctx.getStepView('step_1'), ctx.getStepView('step_1')])
            expect(first).toEqual({ output: payload, error: undefined })
            expect(second).toEqual({ output: payload, error: undefined })
            expect(fetchSpy).toHaveBeenCalledTimes(1)
        })

        test('a failed download is retried instead of cached', async () => {
            const payload = { value: 'recovered' }
            const fetchSpy = vi.fn()
                .mockImplementationOnce(async () => new Response('gone', { status: 404 }))
                .mockImplementation(async () => new Response(JSON.stringify(payload)))
            vi.stubGlobal('fetch', fetchSpy)

            let ctx = FlowExecutorContext.empty({ engineApi: ENGINE_API })
            ctx = await ctx.upsertStep('step_1', makeSliceStep('slice-3'))

            await expect(ctx.getStepView('step_1')).rejects.toThrow()
            expect(await ctx.getStepView('step_1')).toEqual({ output: payload, error: undefined })
        })
    })

    describe('store put failure', () => {
        afterEach(() => {
            vi.restoreAllMocks()
        })

        test('upsertStep keeps the full step in memory and deletes the stale store row', async () => {
            vi.spyOn(console, 'warn').mockImplementation(() => undefined)
            let ctx = await FlowExecutorContext.empty().upsertStep('step_1', makePieceStep({ version: 1 }))
            expect(ctx.steps.step_1.output).toBeUndefined()

            vi.spyOn(runStateStore, 'put').mockImplementationOnce(() => {
                throw new Error('disk full')
            })
            ctx = await ctx.upsertStep('step_1', makePieceStep({ version: 2 }))

            expect(ctx.steps.step_1.output).toEqual({ version: 2 })
            expect(runStateStore.getStepOutput({ name: 'step_1', stepPath: '[]' })).toBeUndefined()
            expect(ctx.getStepOutput('step_1')?.output).toEqual({ version: 2 })
            expect(await ctx.getStepView('step_1')).toEqual({ output: { version: 2 }, error: undefined })
        })

        test('the in-memory step wins over a stale store row when the delete also fails', async () => {
            vi.spyOn(console, 'warn').mockImplementation(() => undefined)
            let ctx = await FlowExecutorContext.empty().upsertStep('step_1', makePieceStep({ version: 1 }))

            vi.spyOn(runStateStore, 'put').mockImplementationOnce(() => {
                throw new Error('disk full')
            })
            vi.spyOn(runStateStore, 'deleteStep').mockImplementationOnce(() => undefined)
            ctx = await ctx.upsertStep('step_1', makePieceStep({ version: 2 }))

            expect(runStateStore.getStepOutput({ name: 'step_1', stepPath: '[]' })?.output).toEqual({ version: 1 })
            expect(ctx.getStepOutput('step_1')?.output).toEqual({ version: 2 })
            expect(await ctx.getStepView('step_1')).toEqual({ output: { version: 2 }, error: undefined })
        })
    })
})
