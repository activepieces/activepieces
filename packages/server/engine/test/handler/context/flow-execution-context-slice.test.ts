import { FlowActionType, GenericStepOutput, StepOutputStatus, StepOutputType } from '@activepieces/shared'
import { describe, expect, it, vi } from 'vitest'
import { engineFileApi } from '../../../src/lib/api/engine-file-api'
import { FlowExecutorContext } from '../../../src/lib/handler/context/flow-execution-context'

vi.mock('../../../src/lib/api/engine-file-api', () => ({
    engineFileApi: {
        upload: vi.fn().mockResolvedValue({ fileId: 'file-1', readUrl: 'http://example.com/file-1' }),
    },
}))

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
        // The ref must survive as the stored output so resolveStepOutput can fetch the
        // real payload on demand later.
        expect(stepOutput.output).toEqual({
            fileId: 'file-1',
            size: 4_096,
            url: 'http://example.com/file-1',
        })
    })
})

describe('FlowExecutorContext.upsertStep — slice upload file naming (GIT-1568)', () => {
    it('uploads the offloaded output as <stepName>.json so the download saves with a .json extension', async () => {
        const oversized = new GenericStepOutput({
            type: FlowActionType.CODE,
            status: StepOutputStatus.SUCCEEDED,
            input: {},
            output: { data: 'x'.repeat(64 * 1024) },
        })

        const ctx = FlowExecutorContext.empty({
            engineApi: { engineToken: 'token', internalApiUrl: 'http://127.0.0.1:3000' },
        })
        const next = await ctx.upsertStep('echo_step', oversized)

        expect(next.steps.echo_step.outputType).toBe(StepOutputType.SLICE)
        expect(engineFileApi.upload).toHaveBeenCalledWith(
            expect.objectContaining({ fileName: 'echo_step.json' }),
        )
    })
})
