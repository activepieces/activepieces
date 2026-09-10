import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EngineResponseStatus, FlowTriggerType, FlowVersionState, WorkerJobType } from '@activepieces/shared'
import type { FlowVersion, PollingJobData } from '@activepieces/shared'

vi.mock('../../../../src/lib/config/worker-settings', () => ({
    workerSettings: {
        getSettings: vi.fn().mockReturnValue({ TRIGGER_TIMEOUT_SECONDS: 30 }),
    },
}))

import { executePollingJob } from '../../../../src/lib/execute/jobs/execute-polling'
import { JobResultKind } from '../../../../src/lib/execute/types'
import type { JobContext } from '../../../../src/lib/execute/types'

function makeFlowVersion(): FlowVersion {
    return {
        id: 'fv-1',
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-01T00:00:00Z',
        flowId: 'flow-1',
        displayName: 'Test Flow',
        trigger: {
            name: 'trigger_1',
            valid: true,
            displayName: 'New Row',
            lastUpdatedDate: '2024-01-01T00:00:00Z',
            type: FlowTriggerType.PIECE,
            settings: {
                pieceName: '@activepieces/piece-google-sheets',
                pieceVersion: '~0.1.0',
                triggerName: 'new_row',
                input: {},
                propertySettings: {},
            },
        },
        updatedBy: null,
        valid: true,
        schemaVersion: null,
        agentIds: [],
        state: FlowVersionState.LOCKED,
        connectionIds: [],
        backupFiles: null,
        notes: [],
    }
}

function makePollingJobData(): PollingJobData {
    return {
        projectId: 'proj-1',
        platformId: 'plat-1',
        schemaVersion: 4,
        flowVersionId: 'fv-1',
        flowId: 'flow-1',
        triggerType: FlowTriggerType.PIECE,
        jobType: WorkerJobType.EXECUTE_POLLING,
    }
}

function makeMockContext(opts?: { executeResult?: unknown }): JobContext {
    return {
        jobId: 'job-1',
        log: {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
        },
        apiClient: {
            submitPayloads: vi.fn(),
            recordTriggerRun: vi.fn(),
        },
        resolver: {
            resolve: vi.fn().mockResolvedValue({
                kind: 'ready',
                provision: { platformId: 'plat-1', pieces: [], codes: [], publicApiUrl: 'http://localhost:3000/api/', engineToken: 'test-token' },
                flowVersion: makeFlowVersion(),
            }),
        },
        runtime: {
            execute: vi.fn().mockResolvedValue(opts?.executeResult ?? { status: EngineResponseStatus.OK, response: { output: [] } }),
        },
        workerIndex: 0,
        engineToken: 'test-token',
        internalApiUrl: 'http://localhost:3000',
        publicApiUrl: 'http://localhost:4200',
    } as unknown as JobContext
}

const expectedBaseFields = {
    flow: { id: 'flow-1' },
    flowVersion: { id: 'fv-1' },
    project: { id: 'proj-1' },
}

describe('executePollingJob silent-drop visibility', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('logs at error level with the engine error on a non-user engine failure and still completes OK', async () => {
        const ctx = makeMockContext({ executeResult: { status: EngineResponseStatus.INTERNAL_ERROR, response: undefined, error: 'engine exploded' } })

        const result = await executePollingJob.execute(ctx, makePollingJobData())

        expect(ctx.apiClient.submitPayloads).not.toHaveBeenCalled()
        expect(ctx.log.error).toHaveBeenCalledWith(
            expect.objectContaining({
                ...expectedBaseFields,
                engine: { status: EngineResponseStatus.INTERNAL_ERROR, error: 'engine exploded' },
            }),
            expect.stringContaining('no flow run created'),
        )
        expect(result).toMatchObject({ kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK })
    })

    it('logs at warn level when the trigger hook fails with USER_FAILURE', async () => {
        const ctx = makeMockContext({ executeResult: { status: EngineResponseStatus.USER_FAILURE, response: undefined, error: 'trigger threw' } })

        const result = await executePollingJob.execute(ctx, makePollingJobData())

        expect(ctx.log.error).not.toHaveBeenCalled()
        expect(ctx.log.warn).toHaveBeenCalledWith(
            expect.objectContaining({
                ...expectedBaseFields,
                engine: { status: EngineResponseStatus.USER_FAILURE, error: 'trigger threw' },
            }),
            expect.stringContaining('no flow run created'),
        )
        expect(result).toMatchObject({ kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK })
    })

    it('does not log an empty poll result', async () => {
        const ctx = makeMockContext()

        const result = await executePollingJob.execute(ctx, makePollingJobData())

        expect(ctx.apiClient.submitPayloads).not.toHaveBeenCalled()
        expect(ctx.log.error).not.toHaveBeenCalled()
        expect(ctx.log.warn).not.toHaveBeenCalled()
        expect(result).toMatchObject({ kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK })
    })
})
