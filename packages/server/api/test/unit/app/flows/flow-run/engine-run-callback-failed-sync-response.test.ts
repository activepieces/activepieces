import { FlowRunStatus } from '@activepieces/shared'
import { StatusCodes } from 'http-status-codes'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockPublish, mockRunsMetadataAdd } = vi.hoisted(() => ({
    mockPublish: vi.fn(),
    mockRunsMetadataAdd: vi.fn(),
}))

vi.mock('../../../../../src/app/helper/pubsub', () => ({
    pubsub: { publish: mockPublish, subscribe: vi.fn(), unsubscribe: vi.fn() },
}))

vi.mock('../../../../../src/app/flows/flow-run/flow-runs-queue', () => ({
    runsMetadataQueue: () => ({ add: mockRunsMetadataAdd }),
}))

vi.mock('../../../../../src/app/helper/system/system', () => ({
    system: { getEdition: vi.fn().mockReturnValue('cloud') },
}))

vi.mock('../../../../../src/app/core/websockets.service', () => ({
    websocketService: { to: () => ({ emit: vi.fn() }) },
}))

vi.mock('../../../../../src/app/file/file.service', () => ({
    fileService: () => ({ exists: vi.fn(), getDataOrUndefined: vi.fn(), save: vi.fn() }),
}))

vi.mock('../../../../../src/app/file/file-compressor', () => ({
    fileCompressor: { compress: vi.fn() },
}))

vi.mock('../../../../../src/app/project/project-service', () => ({
    projectService: () => ({ getPlatformId: vi.fn() }),
}))

const { engineRunCallbackService } = await import('../../../../../src/app/flows/flow-run/engine-run-callback-service')

const noopLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }

const uploadRunLog = (status: FlowRunStatus, ids?: { workerHandlerId?: string, httpRequestId?: string }) =>
    engineRunCallbackService(noopLogger as never).uploadRunLog({
        projectId: 'proj-1',
        request: {
            runId: 'run-1',
            projectId: 'proj-1',
            status,
            finishTime: new Date().toISOString(),
            ...ids,
        },
    })

describe('uploadRunLog answering a waiting sync request', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it.each([
        FlowRunStatus.FAILED,
        FlowRunStatus.INTERNAL_ERROR,
        FlowRunStatus.TIMEOUT,
        FlowRunStatus.MEMORY_LIMIT_EXCEEDED,
        FlowRunStatus.LOG_SIZE_EXCEEDED,
    ])('publishes a 500 for %s instead of leaving the caller to time out', async (status) => {
        await uploadRunLog(status, { workerHandlerId: 'server-1', httpRequestId: 'req-1' })

        expect(mockPublish).toHaveBeenCalledTimes(1)
        const [channel, message] = mockPublish.mock.calls[0]
        expect(channel).toBe('engine-run:sync:server-1')
        expect(JSON.parse(message)).toEqual({
            requestId: 'req-1',
            response: {
                status: StatusCodes.INTERNAL_SERVER_ERROR,
                body: { message: 'The flow has failed and there is no response returned' },
                headers: {},
            },
        })
    })

    it.each([
        FlowRunStatus.SUCCEEDED,
        FlowRunStatus.PAUSED,
        FlowRunStatus.RUNNING,
        FlowRunStatus.QUEUED,
        FlowRunStatus.QUOTA_EXCEEDED,
        FlowRunStatus.CANCELED,
    ])('stays silent for %s so a respond step or the caller default still decides', async (status) => {
        await uploadRunLog(status, { workerHandlerId: 'server-1', httpRequestId: 'req-1' })

        expect(mockPublish).not.toHaveBeenCalled()
    })

    it('stays silent for a failed async run that has no waiting caller', async () => {
        await uploadRunLog(FlowRunStatus.FAILED)

        expect(mockPublish).not.toHaveBeenCalled()
    })

    it('stays silent when only one of the two correlation ids is present', async () => {
        await uploadRunLog(FlowRunStatus.FAILED, { httpRequestId: 'req-1' })
        await uploadRunLog(FlowRunStatus.FAILED, { workerHandlerId: 'server-1' })

        expect(mockPublish).not.toHaveBeenCalled()
    })

    it('still records the run metadata when it answers', async () => {
        await uploadRunLog(FlowRunStatus.FAILED, { workerHandlerId: 'server-1', httpRequestId: 'req-1' })

        expect(mockRunsMetadataAdd).toHaveBeenCalledTimes(1)
        expect(mockRunsMetadataAdd.mock.calls[0][0]).toMatchObject({ id: 'run-1', status: FlowRunStatus.FAILED })
    })
})
