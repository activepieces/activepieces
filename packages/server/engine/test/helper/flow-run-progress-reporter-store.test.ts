import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { Readable } from 'node:stream'
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

async function buildContextWithLoop(): Promise<FlowExecutorContext> {
    let ctx = FlowExecutorContext.empty()
    ctx = await ctx.upsertStep('trigger_1', makePieceStep({ input: { key: 'trigger-input' }, output: { items: [1, 2] } }))
    const loop = LoopStepOutput.init({ input: { items: '{{trigger_1.items}}' } })
        .setItemAndIndex({ item: 1, index: 1 })
        .addIteration()
    ctx = await ctx.upsertStep('loop_1', loop)
    ctx = ctx.setCurrentPath(ctx.currentPath.loopIteration({ loopName: 'loop_1', iteration: 0 }))
    ctx = await ctx.upsertStep('math', makePieceStep({ input: { first: 1 }, output: { result: 2 } }))
    return ctx.setCurrentPath(StepExecutionPath.empty())
}

async function runBackup(ctx: FlowExecutorContext): Promise<Buffer | Readable> {
    await flowRunProgressReporter.sendUpdate({
        engineConstants: generateMockEngineConstants({ logsFileId: 'logs-1' }),
        flowExecutorContext: ctx,
    })
    await flowRunProgressReporter.backup()

    expect(mockUpload).toHaveBeenCalledTimes(1)
    return mockUpload.mock.calls[0][0].data
}

async function parseUploadedLog(uploaded: Buffer | Readable): Promise<Record<string, unknown>> {
    let compressed: Buffer
    if (uploaded instanceof Readable) {
        const chunks: Buffer[] = []
        for await (const chunk of uploaded) {
            chunks.push(chunk)
        }
        compressed = Buffer.concat(chunks)
    }
    else {
        compressed = uploaded
    }
    const serialized = await zstdDecompress(compressed)
    return JSON.parse(serialized.toString('utf-8'))
}

async function runBackupAndParseUploadedLog(ctx: FlowExecutorContext): Promise<Record<string, unknown>> {
    return parseUploadedLog(await runBackup(ctx))
}

const expectedLog = {
    version: 2,
    executionState: {
        steps: {
            trigger_1: {
                type: FlowActionType.PIECE,
                status: StepOutputStatus.SUCCEEDED,
                input: { key: 'trigger-input' },
                output: { items: [1, 2] },
            },
            loop_1: {
                type: FlowActionType.LOOP_ON_ITEMS,
                status: StepOutputStatus.SUCCEEDED,
                input: { items: '{{trigger_1.items}}' },
                output: {
                    item: 1,
                    index: 1,
                    iterations: [
                        {
                            math: {
                                type: FlowActionType.PIECE,
                                status: StepOutputStatus.SUCCEEDED,
                                input: { first: 1 },
                                output: { result: 2 },
                            },
                        },
                    ],
                },
            },
        },
        tags: [],
    },
}

describe('flowRunProgressReporter backup with runStateStore', () => {
    beforeAll(() => {
        process.env.AP_FLOWS_CACHE_PATH = fs.mkdtempSync(path.join(os.tmpdir(), 'progress-reporter-store-test-'))
    })

    beforeEach(() => {
        mockUpload.mockClear()
        mockUploadRunLog.mockClear()
        runStateStore.init({ runId: 'test-run-id' })
    })

    afterEach(() => {
        runStateStore.dispose()
    })

    test('backup streams a log with full input and output rebuilt from the store, including nested loop steps', async () => {
        const ctx = await buildContextWithLoop()

        expect(ctx.steps.trigger_1.input).toBeUndefined()
        expect(ctx.steps.trigger_1.output).toBeUndefined()

        const parsed = await runBackupAndParseUploadedLog(ctx)
        expect(parsed).toEqual(expectedLog)
    })

    test('backup streams the same log from in-memory steps when the store is not initialized', async () => {
        runStateStore.dispose()
        const ctx = await buildContextWithLoop()

        expect(ctx.steps.trigger_1.input).toEqual({ key: 'trigger-input' })
        expect(ctx.steps.trigger_1.output).toEqual({ items: [1, 2] })

        const parsed = await runBackupAndParseUploadedLog(ctx)
        expect(parsed).toEqual(expectedLog)
    })

    test('backup uploads a buffered log when the state is below the size threshold', async () => {
        const ctx = await buildContextWithLoop()
        const uploaded = await runBackup(ctx)
        expect(uploaded).toBeInstanceOf(Buffer)
        expect(await parseUploadedLog(uploaded)).toEqual(expectedLog)
    })

    test('backup streams the log when the state exceeds the size threshold', async () => {
        const ctx = new FlowExecutorContext({ ...(await buildContextWithLoop()), logSizeBytes: 5 * 1024 * 1024 })
        const uploaded = await runBackup(ctx)
        expect(uploaded).toBeInstanceOf(Readable)
        expect(await parseUploadedLog(uploaded)).toEqual(expectedLog)
    })

    test('backup serializes the in-memory copy when a step fell back to memory over a stale store row', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        let ctx = FlowExecutorContext.empty()
        ctx = await ctx.upsertStep('trigger_1', makePieceStep({ input: { key: 'in' }, output: { version: 1 } }))
        vi.spyOn(runStateStore, 'put').mockImplementationOnce(() => {
            throw new Error('disk full')
        })
        vi.spyOn(runStateStore, 'deleteStep').mockImplementationOnce(() => undefined)
        ctx = await ctx.upsertStep('trigger_1', makePieceStep({ input: { key: 'in' }, output: { version: 2 } }))
        vi.restoreAllMocks()

        const parsed = await runBackupAndParseUploadedLog(ctx) as { executionState: { steps: Record<string, { output: unknown }> } }
        expect(parsed.executionState.steps.trigger_1.output).toEqual({ version: 2 })
    })
})
