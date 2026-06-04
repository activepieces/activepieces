import { FlowActionType, GenericStepOutput, StepOutputStatus, StepOutputType } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { FlowExecutorContext } from '../../../src/lib/handler/context/flow-execution-context'

describe('FlowExecutorContext.upsertStep — outputType: StepOutputType.SLICE preservation', () => {
    it('keeps the slice discriminant when upserting an already-sliced step (RESUME restore)', async () => {
        const restored = new GenericStepOutput({
            type: FlowActionType.CODE,
            status: StepOutputStatus.SUCCEEDED,
            input: {},
            outputType: StepOutputType.SLICE,
            output: { fileId: 'file-1', size: 4_096, url: 'http://example.com/file-1' },
        })

        const ctx = FlowExecutorContext.empty()
        const next = await ctx.upsertStep('echo_step', restored)

        const stepOutput = next.steps.echo_step
        expect(stepOutput.outputType).toBe(StepOutputType.SLICE)
        // The ref must survive as the stored output so materializeStep can fetch the
        // real payload on demand later.
        expect(stepOutput.output).toEqual({
            fileId: 'file-1',
            size: 4_096,
            url: 'http://example.com/file-1',
        })
    })
})
