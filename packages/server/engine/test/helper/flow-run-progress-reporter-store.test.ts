import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { promisify } from 'node:util'
import { zstdDecompress as zstdDecompressCallback } from 'node:zlib'
import { FlowActionType, GenericStepOutput, LoopStepOutput, StepOutputStatus } from '@activepieces/shared'
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'

const { mockUpload } = vi.hoisted(() => ({
    mockUpload: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('../../src/lib/api/engine-file-api', () => ({
    engineFileApi: {
        upload: mockUpload,
        download: vi.fn(),
    },
}))

const { mockUploadRunLog } = vi.hoisted(() => ({
    mockUploadRunLog: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('../../src/lib/api/engine-run-api', () => ({
    engineRunApi: {
        uploadRunLog: mockUploadRunLog,
        updateRunProgress: vi.fn().mockResolvedValue(undefined),
        updateStepProgress: vi.fn().mockResolvedValue(undefined),
    },
}))

import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { StepExecutionPath } from '../../src/lib/handler/context/step-execution-path'
import { flowRunProgressReporter } from '../../src/lib/helper/flow-run-progress-reporter'
import { runStateStore } from '../../src/lib/helper/run-state-store'
import { generateMockEngineConstants } from '../handler/test-helper'

const zstdDecompress = promisify(zstdDecompressCallback)

function makePieceStep({ input, output }: { input: unknown, output: unknown }): GenericStepOutput<FlowActionType.PIECE, unknown> {
    return GenericStepOutput.create({
        type: FlowActionType.PIECE,
        status: StepOutputStatus.SUCCEEDED,
        input,
        output,
    })
}

describe('flowRunProgressReporter backup with runStateStore', () => {
    beforeAll(() => {
        process.env.AP_FLOWS_CACHE_PATH = fs.mkdtempSync(path.join(os.tmpdir(), 'progress-reporter-store-test-'))
    })

    beforeEach(() => {
        mockUpload.mockClear()
        mockUploadRunLog.mockClear()
        runStateStore.init({ runId: 'test-run-id', flowVersionId: 'test-flow-version-id' })
    })

    afterEach(() => {
        runStateStore.dispose()
    })

    test('backup logs carry full input and output rebuilt from the store, including nested loop steps', async () => {
        let ctx = FlowExecutorContext.empty()
        ctx = await ctx.upsertStep('trigger_1', makePieceStep({ input: { key: 'trigger-input' }, output: { items: [1, 2] } }))
        const loop = LoopStepOutput.init({ input: { items: '{{trigger_1.items}}' } })
            .setItemAndIndex({ item: 1, index: 1 })
            .addIteration()
        ctx = await ctx.upsertStep('loop_1', loop)
        ctx = ctx.setCurrentPath(ctx.currentPath.loopIteration({ loopName: 'loop_1', iteration: 0 }))
        ctx = await ctx.upsertStep('math', makePieceStep({ input: { first: 1 }, output: { result: 2 } }))
        ctx = ctx.setCurrentPath(StepExecutionPath.empty())

        expect(ctx.steps.trigger_1.input).toBeUndefined()
        expect(ctx.steps.trigger_1.output).toBeUndefined()

        await flowRunProgressReporter.sendUpdate({
            engineConstants: generateMockEngineConstants({ logsFileId: 'logs-1' }),
            flowExecutorContext: ctx,
        })
        await flowRunProgressReporter.backup()

        expect(mockUpload).toHaveBeenCalledTimes(1)
        const serialized = await zstdDecompress(mockUpload.mock.calls[0][0].data)
        const steps = JSON.parse(serialized.toString('utf-8')).executionState.steps

        expect(steps.trigger_1.input).toEqual({ key: 'trigger-input' })
        expect(steps.trigger_1.output).toEqual({ items: [1, 2] })
        expect(steps.loop_1.input).toEqual({ items: '{{trigger_1.items}}' })
        expect(steps.loop_1.output.item).toBe(1)
        expect(steps.loop_1.output.iterations[0].math.input).toEqual({ first: 1 })
        expect(steps.loop_1.output.iterations[0].math.output).toEqual({ result: 2 })
    })
})
