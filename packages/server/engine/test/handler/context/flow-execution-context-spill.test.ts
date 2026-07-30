import { FlowActionType, GenericStepOutput, LoopStepOutput, StepOutputStatus, StepOutputType } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FlowExecutorContext } from '../../../src/lib/handler/context/flow-execution-context'
import { StepExecutionPath } from '../../../src/lib/handler/context/step-execution-path'

vi.mock('../../../src/lib/api/engine-file-api', () => ({
    engineFileApi: {
        upload: vi.fn(async ({ fileId }: { fileId: string }) => ({ fileId, readUrl: `http://storage/${fileId}` })),
        download: vi.fn(),
    },
}))

const { engineFileApi } = await import('../../../src/lib/api/engine-file-api')

const ENGINE_API = { engineToken: 'token', internalApiUrl: 'http://api' }
const LOOP_NAME = 'loop'

function codeStep(output: unknown): GenericStepOutput<FlowActionType.CODE, unknown> {
    return GenericStepOutput.create({
        type: FlowActionType.CODE,
        status: StepOutputStatus.SUCCEEDED,
        input: { key: 'value' },
    }).setOutput(output)
}

async function contextWithClosedIteration(steps: Record<string, GenericStepOutput<FlowActionType, unknown>>, params?: { engineApi?: typeof ENGINE_API }): Promise<FlowExecutorContext> {
    let ctx = FlowExecutorContext.empty({ engineApi: params?.engineApi })
    const loop = LoopStepOutput.init({ input: null }).setItemAndIndex({ item: 1, index: 1 }).addIteration()
    ctx = await ctx.upsertStep(LOOP_NAME, loop)
    ctx = ctx.setCurrentPath(StepExecutionPath.empty().loopIteration({ loopName: LOOP_NAME, iteration: 0 }))
    for (const [stepName, stepOutput] of Object.entries(steps)) {
        ctx = await ctx.upsertStep(stepName, stepOutput)
    }
    return ctx.setCurrentPath(ctx.currentPath.removeLast())
}

function iterationStep(ctx: FlowExecutorContext, stepName: string): GenericStepOutput<FlowActionType, unknown> {
    const loop = ctx.steps[LOOP_NAME] as LoopStepOutput
    return loop.output?.iterations[0][stepName] as GenericStepOutput<FlowActionType, unknown>
}

describe('FlowExecutorContext.spillClosedIteration', () => {
    beforeEach(() => {
        vi.mocked(engineFileApi.upload).mockClear()
    })

    it('spills outputs above the floor into slice refs, keeping the step skeleton inline', async () => {
        const bigOutput = { data: 'x'.repeat(2_000) }
        let ctx = await contextWithClosedIteration({ echo_step: codeStep(bigOutput) }, { engineApi: ENGINE_API })

        ctx = await ctx.spillClosedIteration({ loopName: LOOP_NAME, iteration: 0 })

        const spilled = iterationStep(ctx, 'echo_step')
        expect(spilled.outputType).toBe(StepOutputType.SLICE)
        expect(spilled.output).toMatchObject({ size: expect.any(Number), url: expect.stringContaining('http://storage/') })
        expect(spilled.status).toBe(StepOutputStatus.SUCCEEDED)
        expect(spilled.input).toEqual({ key: 'value' })
        expect(engineFileApi.upload).toHaveBeenCalledTimes(1)
    })

    it('keeps outputs at or below the floor inline', async () => {
        const tinyOutput = { count: 42 }
        let ctx = await contextWithClosedIteration({ echo_step: codeStep(tinyOutput) }, { engineApi: ENGINE_API })

        ctx = await ctx.spillClosedIteration({ loopName: LOOP_NAME, iteration: 0 })

        const step = iterationStep(ctx, 'echo_step')
        expect(step.outputType).toBeUndefined()
        expect(step.output).toEqual(tinyOutput)
        expect(engineFileApi.upload).not.toHaveBeenCalled()
    })

    it('does not re-upload steps that are already slice refs', async () => {
        const restored = new GenericStepOutput({
            type: FlowActionType.CODE,
            status: StepOutputStatus.SUCCEEDED,
            input: {},
            outputType: StepOutputType.SLICE,
            output: { fileId: 'file-1', size: 4_096, url: 'http://storage/file-1' },
        })
        let ctx = await contextWithClosedIteration({ echo_step: restored }, { engineApi: ENGINE_API })

        ctx = await ctx.spillClosedIteration({ loopName: LOOP_NAME, iteration: 0 })

        expect(iterationStep(ctx, 'echo_step').output).toEqual({ fileId: 'file-1', size: 4_096, url: 'http://storage/file-1' })
        expect(engineFileApi.upload).not.toHaveBeenCalled()
    })

    it('skips nested loop steps', async () => {
        const nestedLoop = LoopStepOutput.init({ input: null }).setItemAndIndex({ item: 'x'.repeat(2_000), index: 1 }).addIteration()
        let ctx = await contextWithClosedIteration({ inner_loop: nestedLoop }, { engineApi: ENGINE_API })

        ctx = await ctx.spillClosedIteration({ loopName: LOOP_NAME, iteration: 0 })

        expect(iterationStep(ctx, 'inner_loop').outputType).toBeUndefined()
        expect(engineFileApi.upload).not.toHaveBeenCalled()
    })

    it('is a no-op without an engine api config', async () => {
        const bigOutput = { data: 'x'.repeat(2_000) }
        let ctx = await contextWithClosedIteration({ echo_step: codeStep(bigOutput) })

        ctx = await ctx.spillClosedIteration({ loopName: LOOP_NAME, iteration: 0 })

        const step = iterationStep(ctx, 'echo_step')
        expect(step.outputType).toBeUndefined()
        expect(step.output).toEqual(bigOutput)
    })

    it('leaves the value inline when the upload fails', async () => {
        vi.mocked(engineFileApi.upload).mockRejectedValueOnce(new Error('storage down'))
        const bigOutput = { data: 'x'.repeat(2_000) }
        let ctx = await contextWithClosedIteration({ echo_step: codeStep(bigOutput) }, { engineApi: ENGINE_API })

        ctx = await ctx.spillClosedIteration({ loopName: LOOP_NAME, iteration: 0 })

        const step = iterationStep(ctx, 'echo_step')
        expect(step.outputType).toBeUndefined()
        expect(step.output).toEqual(bigOutput)
    })
})
