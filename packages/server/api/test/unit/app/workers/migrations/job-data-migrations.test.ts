import { ExecuteFlowJobData, ExecutionType, FlowTriggerType, PollingJobData, RunEnvironment, StreamStepProgress, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../../../src/app/flows/flow-version/flow-version.service', () => ({
    flowVersionService: () => ({
        getOne: vi.fn().mockResolvedValue({ flowId: 'flow-1' }),
    }),
    flowVersionRepo: () => ({}),
}))

const { jobMigrations } = await import('../../../../../src/app/workers/migrations/job-data-migrations')

const mockLog: FastifyBaseLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    child: vi.fn(),
    silent: vi.fn(),
    level: 'info',
} as unknown as FastifyBaseLogger

const LATEST = 8

function baseFlowJob(overrides: Partial<ExecuteFlowJobData> = {}): ExecuteFlowJobData {
    return {
        jobType: WorkerJobType.EXECUTE_FLOW,
        schemaVersion: 6,
        projectId: 'proj-1',
        platformId: 'plat-1',
        flowId: 'flow-1',
        flowVersionId: 'fv-1',
        runId: 'run-1',
        environment: RunEnvironment.PRODUCTION,
        executionType: ExecutionType.BEGIN,
        streamStepProgress: StreamStepProgress.NONE,
        payload: { type: 'inline', value: {} },
        logsFileId: 'file-1',
        ...overrides,
    }
}

function basePollingJob(overrides: Partial<PollingJobData> = {}): PollingJobData {
    return {
        jobType: WorkerJobType.EXECUTE_POLLING,
        schemaVersion: 6,
        projectId: 'proj-1',
        platformId: 'plat-1',
        flowVersionId: 'fv-1',
        flowId: 'flow-1',
        triggerType: FlowTriggerType.PIECE,
        ...overrides,
    }
}

describe('jobMigrations v6 → v7 (dropLogsUploadUrl)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('strips logsUploadUrl from EXECUTE_FLOW at v6 and bumps to latest', async () => {
        const legacy = {
            ...baseFlowJob({ schemaVersion: 6 }),
            logsUploadUrl: 'https://old-api.example.com/v1/flow-runs/logs?token=ABC',
        }

        const migrated = await jobMigrations(mockLog).apply(legacy) as ExecuteFlowJobData & Record<string, unknown>

        expect(migrated.schemaVersion).toBe(LATEST)
        expect(migrated.logsUploadUrl).toBeUndefined()
        // Other identifying fields preserved
        expect(migrated.runId).toBe('run-1')
        expect(migrated.logsFileId).toBe('file-1')
    })

    it('passes through non-EXECUTE_FLOW jobs at v6 without mutating shape, bumps to latest', async () => {
        const job = basePollingJob({ schemaVersion: 6 })

        const migrated = await jobMigrations(mockLog).apply(job)

        expect(migrated.schemaVersion).toBe(LATEST)
        expect(migrated.jobType).toBe(WorkerJobType.EXECUTE_POLLING)
        expect((migrated as PollingJobData).triggerType).toBe(FlowTriggerType.PIECE)
    })

    it('is a no-op for jobs already at the latest schemaVersion', async () => {
        const job = baseFlowJob({ schemaVersion: LATEST })

        const migrated = await jobMigrations(mockLog).apply(job)

        expect(migrated.schemaVersion).toBe(LATEST)
        expect(migrated.runId).toBe('run-1')
    })
})

describe('jobMigrations v7 → v8 (backfillRequiredExecuteFlowFields)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('maps legacy progressUpdateType=TEST_FLOW to streamStepProgress=WEBSOCKET', async () => {
        const legacy = {
            ...baseFlowJob({ schemaVersion: 7 }),
            streamStepProgress: undefined,
            progressUpdateType: 'TEST_FLOW',
        } as Record<string, unknown>

        const migrated = await jobMigrations(mockLog).apply(legacy) as ExecuteFlowJobData

        expect(migrated.schemaVersion).toBe(LATEST)
        expect(migrated.streamStepProgress).toBe(StreamStepProgress.WEBSOCKET)
    })

    it('maps legacy progressUpdateType=WEBHOOK_RESPONSE to streamStepProgress=WEBSOCKET', async () => {
        const legacy = {
            ...baseFlowJob({ schemaVersion: 7 }),
            streamStepProgress: undefined,
            progressUpdateType: 'WEBHOOK_RESPONSE',
        } as Record<string, unknown>

        const migrated = await jobMigrations(mockLog).apply(legacy) as ExecuteFlowJobData

        expect(migrated.streamStepProgress).toBe(StreamStepProgress.WEBSOCKET)
    })

    it('falls back to streamStepProgress=NONE for unknown legacy progressUpdateType', async () => {
        const legacy = {
            ...baseFlowJob({ schemaVersion: 7 }),
            streamStepProgress: undefined,
            progressUpdateType: undefined,
        } as Record<string, unknown>

        const migrated = await jobMigrations(mockLog).apply(legacy) as ExecuteFlowJobData

        expect(migrated.streamStepProgress).toBe(StreamStepProgress.NONE)
    })

    it('renames legacy synchronousHandlerId to workerHandlerId', async () => {
        const legacy = {
            ...baseFlowJob({ schemaVersion: 7 }),
            workerHandlerId: undefined,
            synchronousHandlerId: 'handler-7',
        } as Record<string, unknown>

        const migrated = await jobMigrations(mockLog).apply(legacy) as ExecuteFlowJobData

        expect(migrated.workerHandlerId).toBe('handler-7')
    })

    it('preserves an explicit workerHandlerId / streamStepProgress already set', async () => {
        const job = baseFlowJob({
            schemaVersion: 7,
            workerHandlerId: 'explicit-handler',
            streamStepProgress: StreamStepProgress.WEBSOCKET,
        })

        const migrated = await jobMigrations(mockLog).apply(job) as ExecuteFlowJobData

        expect(migrated.workerHandlerId).toBe('explicit-handler')
        expect(migrated.streamStepProgress).toBe(StreamStepProgress.WEBSOCKET)
    })

    it('only bumps schemaVersion for non-EXECUTE_FLOW jobs at v7', async () => {
        const job = basePollingJob({ schemaVersion: 7 })

        const migrated = await jobMigrations(mockLog).apply(job)

        expect(migrated.schemaVersion).toBe(LATEST)
        expect(migrated.jobType).toBe(WorkerJobType.EXECUTE_POLLING)
    })
})
