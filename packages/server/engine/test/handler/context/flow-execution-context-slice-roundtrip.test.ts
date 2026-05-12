import { FlowActionType, GenericStepOutput, StepOutputStatus } from '@activepieces/shared'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

const fakeFileStore = new Map<string, Uint8Array>()
const uploadSpy = vi.fn()
const downloadSpy = vi.fn()

vi.mock('../../../src/lib/engine-file-api', () => ({
    engineFileApi: {
        upload: vi.fn(async ({ data, fileId }: { data: Uint8Array, fileId: string }) => {
            fakeFileStore.set(fileId, data)
            uploadSpy(fileId, data.length)
            return { fileId, readUrl: `http://example.com/files/${fileId}` }
        }),
        download: vi.fn(async ({ fileId }: { fileId: string }) => {
            downloadSpy(fileId)
            return fakeFileStore.get(fileId)!
        }),
    },
}))

beforeAll(() => {
    process.env.AP_FLOW_RUN_LOG_SLICE_THRESHOLD_KB = '1'
})

afterEach(() => {
    fakeFileStore.clear()
    uploadSpy.mockClear()
    downloadSpy.mockClear()
})

describe('FlowExecutorContext slice/materialize round-trip', () => {
    it('uploads an over-threshold step output as a slice and resolves it back via currentState()', async () => {
        const FlowExecutorContext = (await import('../../../src/lib/handler/context/flow-execution-context'))
            .FlowExecutorContext

        const ctx = FlowExecutorContext.empty({
            engineToken: 'mock-engine-token',
            internalApiUrl: 'http://127.0.0.1:3000/',
        })

        const bigPayload = { key: 'x'.repeat(5_000) }
        const stepOutput = new GenericStepOutput({
            type: FlowActionType.CODE,
            status: StepOutputStatus.SUCCEEDED,
            input: {},
            output: bigPayload,
        })

        const afterStep1 = await ctx.upsertStep('step_1', stepOutput)

        // Step 1's output was over the 1 KB threshold → must be stored as a slice ref.
        const stored = afterStep1.steps.step_1
        expect(stored.kind).toBe('slice')
        expect(uploadSpy).toHaveBeenCalledTimes(1)
        const [uploadedFileId, uploadedBytes] = uploadSpy.mock.calls[0] as [string, number]
        expect(uploadedBytes).toBeGreaterThan(1024)
        expect(stored.output).toMatchObject({ fileId: uploadedFileId })

        // Step 2 (or any later step) reading the journal must see the original payload,
        // materialized on demand from the slice file.
        const resolved = await afterStep1.currentState()
        expect(resolved.step_1).toEqual(bigPayload)
        expect(downloadSpy).toHaveBeenCalledTimes(1)
        expect(downloadSpy).toHaveBeenCalledWith(uploadedFileId)
    })

    it('reuses the per-execution materialize cache across multiple currentState() calls', async () => {
        const FlowExecutorContext = (await import('../../../src/lib/handler/context/flow-execution-context'))
            .FlowExecutorContext

        const ctx = FlowExecutorContext.empty({
            engineToken: 'mock-engine-token',
            internalApiUrl: 'http://127.0.0.1:3000/',
        })

        const bigPayload = { item: 'y'.repeat(5_000) }
        const stored = await ctx.upsertStep('step_1', new GenericStepOutput({
            type: FlowActionType.CODE,
            status: StepOutputStatus.SUCCEEDED,
            input: {},
            output: bigPayload,
        }))

        await stored.currentState()
        await stored.currentState()

        // First materialize fetches; second hits the per-context cache.
        expect(downloadSpy).toHaveBeenCalledTimes(1)
    })
})
