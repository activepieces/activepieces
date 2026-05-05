import { FlowRunStatus, StreamStepProgress, UpdateRunProgressRequest, UploadRunLogsRequest } from '@activepieces/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { generateMockEngineConstants } from '../handler/test-helper'

const { uploadRunLogMock, updateRunProgressMock } = vi.hoisted(() => ({
    uploadRunLogMock: vi.fn<(request: UploadRunLogsRequest) => Promise<void>>(async () => undefined),
    updateRunProgressMock: vi.fn<(request: UpdateRunProgressRequest) => Promise<void>>(async () => undefined),
}))

vi.mock('../../src/lib/worker-socket', () => ({
    workerSocket: {
        getWorkerClient: () => ({
            uploadRunLog: uploadRunLogMock,
            updateRunProgress: updateRunProgressMock,
            updateStepProgress: vi.fn(),
        }),
    },
}))

vi.mock('fetch-retry', () => ({
    default: () => async () => new Response(null, { status: 200 }),
}))

import { flowRunProgressReporter } from '../../src/lib/helper/flow-run-progress-reporter'

const buildUpdateParams = ({ status }: { status: FlowRunStatus }) => {
    const engineConstants = generateMockEngineConstants({
        streamStepProgress: StreamStepProgress.NONE,
        logsUploadUrl: 'http://127.0.0.1:65535/upload',
    })
    const flowExecutorContext = new FlowExecutorContext()
    flowExecutorContext.verdict = status === FlowRunStatus.RUNNING
        ? { status: FlowRunStatus.RUNNING }
        : { status: FlowRunStatus.SUCCEEDED, stopResponse: undefined }
    return { engineConstants, flowExecutorContext }
}

const uploadStatuses = (): FlowRunStatus[] =>
    uploadRunLogMock.mock.calls.map(([request]) => request.status)

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
