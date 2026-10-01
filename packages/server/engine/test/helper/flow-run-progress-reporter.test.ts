import { FlowActionType, FlowRunStatus, GenericStepOutput, StepOutputStatus, StreamStepProgress, UpdateRunProgressRequest, UploadRunLogsRequest } from '@activepieces/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { generateMockEngineConstants } from '../handler/test-helper'

const { uploadRunLogMock, updateRunProgressMock, updateStepProgressMock } = vi.hoisted(() => ({
    uploadRunLogMock: vi.fn<(params: { apiUrl: string, engineToken: string, request: UploadRunLogsRequest }) => Promise<void>>(async () => undefined),
    updateRunProgressMock: vi.fn<(params: { apiUrl: string, engineToken: string, request: UpdateRunProgressRequest }) => Promise<void>>(async () => undefined),
    updateStepProgressMock: vi.fn<(params: { apiUrl: string, engineToken: string, request: { projectId: string, runId: string, output: unknown } }) => Promise<void>>(async () => undefined),
}))

vi.mock('../../src/lib/api/engine-run-api', () => ({
    engineRunApi: {
        uploadRunLog: uploadRunLogMock,
        updateRunProgress: updateRunProgressMock,
        updateStepProgress: updateStepProgressMock,
    },
}))

vi.mock('fetch-retry', () => ({
    default: () => async () => new Response(JSON.stringify({ readUrl: 'https://mock.read.url/logs' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    }),
}))

import { flowRunProgressReporter } from '../../src/lib/helper/flow-run-progress-reporter'

const buildUpdateParams = ({ status }: { status: FlowRunStatus }) => {
    const engineConstants = generateMockEngineConstants({
        streamStepProgress: StreamStepProgress.NONE,
        engineToken: 'mock-engine-token',
        internalApiUrl: 'http://127.0.0.1:65535/',
        logsFileId: 'logs-1',
    })
    const flowExecutorContext = new FlowExecutorContext()
    flowExecutorContext.verdict = status === FlowRunStatus.RUNNING
        ? { status: FlowRunStatus.RUNNING }
        : { status: FlowRunStatus.SUCCEEDED, stopResponse: undefined }
    return { engineConstants, flowExecutorContext }
}

const uploadStatuses = (): FlowRunStatus[] =>
    uploadRunLogMock.mock.calls.map(([{ request }]) => request.status)

const lastUploadStatus = (): FlowRunStatus | undefined => uploadStatuses().at(-1)

describe('flow-run-progress-reporter backup ordering', () => {
    beforeEach(() => {
        uploadRunLogMock.mockClear()
        updateRunProgressMock.mockClear()
    })

    afterEach(async () => {
        await flowRunProgressReporter.shutdown()
    })

    it('the last write wins: a periodic backup firing after the terminal sendUpdate cannot overwrite SUCCEEDED', async () => {
        flowRunProgressReporter.init()

        await flowRunProgressReporter.sendUpdate(buildUpdateParams({ status: FlowRunStatus.RUNNING }))
        await flowRunProgressReporter.sendUpdate(buildUpdateParams({ status: FlowRunStatus.SUCCEEDED }))
        await flowRunProgressReporter.backup()

        // Simulate the periodic loop firing one more time after the terminal
        // state is set. It must read the current latest state (SUCCEEDED) — not
        // a stale RUNNING — so the run never reverts to running.
        await flowRunProgressReporter.backup()

        expect(lastUploadStatus()).toBe(FlowRunStatus.SUCCEEDED)
        expect(uploadStatuses()).not.toContain(FlowRunStatus.RUNNING)
    })

    it('preserves order under concurrent backup calls', async () => {
        flowRunProgressReporter.init()

        await flowRunProgressReporter.sendUpdate(buildUpdateParams({ status: FlowRunStatus.RUNNING }))
        const firstBackup = flowRunProgressReporter.backup()
        await flowRunProgressReporter.sendUpdate(buildUpdateParams({ status: FlowRunStatus.SUCCEEDED }))
        const secondBackup = flowRunProgressReporter.backup()
        await Promise.all([firstBackup, secondBackup])

        expect(lastUploadStatus()).toBe(FlowRunStatus.SUCCEEDED)
        const allStatuses = uploadStatuses()
        const terminalIndex = allStatuses.indexOf(FlowRunStatus.SUCCEEDED)
        const runningAfterTerminal = allStatuses
            .slice(terminalIndex + 1)
            .some((s) => s === FlowRunStatus.RUNNING)
        expect(runningAfterTerminal).toBe(false)
    })

    it('still uploads RUNNING progress while the flow is in progress', async () => {
        flowRunProgressReporter.init()

        await flowRunProgressReporter.sendUpdate(buildUpdateParams({ status: FlowRunStatus.RUNNING }))
        await flowRunProgressReporter.backup()

        expect(lastUploadStatus()).toBe(FlowRunStatus.RUNNING)
    })

    it('clears state on shutdown so the next run starts clean', async () => {
        flowRunProgressReporter.init()
        await flowRunProgressReporter.sendUpdate(buildUpdateParams({ status: FlowRunStatus.SUCCEEDED }))
        await flowRunProgressReporter.backup()
        await flowRunProgressReporter.shutdown()

        flowRunProgressReporter.init()
        const before = uploadRunLogMock.mock.calls.length
        await flowRunProgressReporter.backup()
        expect(uploadRunLogMock.mock.calls.length).toBe(before)

        await flowRunProgressReporter.sendUpdate(buildUpdateParams({ status: FlowRunStatus.RUNNING }))
        await flowRunProgressReporter.backup()
        expect(lastUploadStatus()).toBe(FlowRunStatus.RUNNING)
    })
})

describe('flow-run-progress-reporter slicing in single-step test mode', () => {
    beforeEach(() => {
        uploadRunLogMock.mockClear()
        updateRunProgressMock.mockClear()
        updateStepProgressMock.mockClear()
        updateStepProgressMock.mockImplementation(async () => undefined)
    })

    afterEach(async () => {
        await flowRunProgressReporter.shutdown()
    })

    it('does not slice step outputs when slicingEnabled is false', async () => {
        const engineConstants = generateMockEngineConstants({
            streamStepProgress: StreamStepProgress.WEBSOCKET,
            engineToken: 'mock-engine-token',
            internalApiUrl: 'http://127.0.0.1:65535/',
            logsFileId: 'logs-1',
            stepNameToTest: 'step_emit_big',
        })

        let flowExecutorContext = FlowExecutorContext.empty({
            engineApi: { engineToken: engineConstants.engineToken, internalApiUrl: engineConstants.internalApiUrl },
            slicingEnabled: false,
        })
        flowExecutorContext.verdict = { status: FlowRunStatus.SUCCEEDED, stopResponse: undefined }

        const big = { big: 'x'.repeat(40_000) }
        flowExecutorContext = await flowExecutorContext.upsertStep('step_emit_big', GenericStepOutput.create({
            type: FlowActionType.CODE,
            status: StepOutputStatus.SUCCEEDED,
            input: {},
            output: big,
        }))

        const stored = flowExecutorContext.steps['step_emit_big']
        expect(stored.outputType).toBeUndefined()
        expect(stored.output).toEqual(big)

        flowRunProgressReporter.init()
        await flowRunProgressReporter.sendUpdate({ engineConstants, flowExecutorContext })
        await flowRunProgressReporter.backup()

        const stepResponse = uploadRunLogMock.mock.calls.at(-1)![0].request.stepResponse
        expect(stepResponse!.output).toEqual(big)
    })

    it('streams the raw payload (runId + output), never a fabricated terminal StepRunResponse', async () => {
        const engineConstants = generateMockEngineConstants({
            streamStepProgress: StreamStepProgress.WEBSOCKET,
            engineToken: 'mock-engine-token',
            internalApiUrl: 'http://127.0.0.1:65535/',
            logsFileId: 'logs-1',
        })

        const outputContext = flowRunProgressReporter.createOutputContext({ engineConstants })

        const big = { big: 'x'.repeat(40_000) }
        await outputContext.update({ data: big })

        const lastCall = updateStepProgressMock.mock.calls.at(-1)
        expect(lastCall).toBeDefined()
        // The streaming frame must carry the actual payload and only progress fields —
        // never the terminal success/standardError fields that 400'd the run (#13885).
        expect(lastCall![0].request).toEqual({
            projectId: engineConstants.projectId,
            runId: engineConstants.flowRunId,
            output: big,
        })
    })

    it('is best-effort: a failed streaming push never throws out of update()', async () => {
        const engineConstants = generateMockEngineConstants({
            streamStepProgress: StreamStepProgress.WEBSOCKET,
            engineToken: 'mock-engine-token',
            internalApiUrl: 'http://127.0.0.1:65535/',
            logsFileId: 'logs-1',
        })
        updateStepProgressMock.mockRejectedValueOnce(new Error('Failed to POST step-progress: 400 Bad Request'))

        const outputContext = flowRunProgressReporter.createOutputContext({ engineConstants })

        // Must resolve, not reject — a streaming failure must not fail the run.
        await expect(outputContext.update({ data: { partial: true } })).resolves.toBeUndefined()
    })

    it('backup emits standardError as "" for a non-success step that has no errorMessage', async () => {
        const engineConstants = generateMockEngineConstants({
            streamStepProgress: StreamStepProgress.WEBSOCKET,
            engineToken: 'mock-engine-token',
            internalApiUrl: 'http://127.0.0.1:65535/',
            logsFileId: 'logs-1',
            stepNameToTest: 'failing_step',
        })

        let flowExecutorContext = FlowExecutorContext.empty({
            engineApi: { engineToken: engineConstants.engineToken, internalApiUrl: engineConstants.internalApiUrl },
            slicingEnabled: false,
        })
        flowExecutorContext.verdict = { status: FlowRunStatus.RUNNING }
        flowExecutorContext = await flowExecutorContext.upsertStep('failing_step', GenericStepOutput.create({
            type: FlowActionType.PIECE,
            status: StepOutputStatus.FAILED,
            input: {},
            output: undefined,
        }))

        flowRunProgressReporter.init()
        await flowRunProgressReporter.sendUpdate({ engineConstants, flowExecutorContext })
        await flowRunProgressReporter.backup()

        const stepResponse = uploadRunLogMock.mock.calls.at(-1)![0].request.stepResponse
        expect(stepResponse!.standardError).toBe('')
    })
})
