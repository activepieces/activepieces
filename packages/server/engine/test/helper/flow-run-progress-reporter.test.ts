import { FlowActionType, FlowRunStatus, GenericStepOutput, StepOutputStatus, StepRunResponse, StreamStepProgress, UpdateRunProgressRequest, UploadRunLogsRequest } from '@activepieces/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { generateMockEngineConstants } from '../handler/test-helper'

type EngineCall<T> = { engineToken: string, apiUrl: string, request: T }

const { uploadRunLogMock, updateRunProgressMock, updateStepProgressMock, uploadFileMock, downloadFileMock } = vi.hoisted(() => ({
    uploadRunLogMock: vi.fn<(input: EngineCall<UploadRunLogsRequest>) => Promise<void>>(async () => undefined),
    updateRunProgressMock: vi.fn<(input: EngineCall<UpdateRunProgressRequest>) => Promise<void>>(async () => undefined),
    updateStepProgressMock: vi.fn<(input: EngineCall<{ projectId: string, stepResponse: StepRunResponse }>) => Promise<void>>(async () => undefined),
    uploadFileMock: vi.fn(async () => ({ fileId: 'logs-1', readUrl: 'https://mock.read.url/logs' })),
    downloadFileMock: vi.fn(async () => new Uint8Array()),
}))

vi.mock('../../src/lib/engine-api-client', () => ({
    engineApiClient: {
        uploadRunLog: uploadRunLogMock,
        updateRunProgress: updateRunProgressMock,
        updateStepProgress: updateStepProgressMock,
        uploadFile: uploadFileMock,
        downloadFile: downloadFileMock,
    },
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
    uploadRunLogMock.mock.calls.map(([input]) => input.request.status)

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

    it('streams the original payload via updateStepProgress even when upsertStep slices the output', async () => {
        const engineConstants = generateMockEngineConstants({
            streamStepProgress: StreamStepProgress.WEBSOCKET,
            engineToken: 'mock-engine-token',
            internalApiUrl: 'http://127.0.0.1:65535/',
            logsFileId: 'logs-1',
        })

        let flowExecutorContext = FlowExecutorContext.empty({
            engineApi: { engineToken: engineConstants.engineToken, internalApiUrl: engineConstants.internalApiUrl },
            slicingEnabled: true,
        })

        const seedStep = GenericStepOutput.create({
            type: FlowActionType.PIECE,
            status: StepOutputStatus.SUCCEEDED,
            input: {},
            output: undefined,
        }) as GenericStepOutput<FlowActionType.PIECE, unknown>

        // Seed the journal so we can read it back and inspect what was stored
        flowExecutorContext = await flowExecutorContext.upsertStep('streaming_step', seedStep)

        const outputContext = flowRunProgressReporter.createOutputContext({
            engineConstants,
            flowExecutorContext,
            stepName: 'streaming_step',
            stepOutput: seedStep,
        })

        const big = { big: 'x'.repeat(40_000) }
        await outputContext.update({ data: big })

        const lastCall = updateStepProgressMock.mock.calls.at(-1)
        expect(lastCall).toBeDefined()
        // The live UI update must carry the actual payload, never the LogSliceRef
        expect(lastCall![0].request.stepResponse.output).toEqual(big)
    })
})
