import { ExecuteFlowJobData, ExecutionType, JobData, RunEnvironment, StreamStepProgress, UploadLogsBehavior, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const TARGET_SCHEMA_VERSION = 8

const SECRET = 'job-data-migrations-test-secret'

const mockConstructUploadUrl = vi.fn(async (req: { flowRunId: string, behavior: UploadLogsBehavior }) => {
    return `https://new-api.example.com/v1/flow-runs/logs?token=NEW_${req.behavior}_${req.flowRunId}`
})

vi.mock('../../../../../src/app/flows/flow-run/logs/flow-run-logs-service', () => ({
    flowRunLogsService: () => ({
        constructUploadUrl: mockConstructUploadUrl,
    }),
}))

vi.mock('../../../../../src/app/flows/flow-version/flow-version.service', () => ({
    flowVersionService: () => ({
        getOne: vi.fn().mockResolvedValue({ flowId: 'flow-1' }),
    }),
    flowVersionRepo: () => ({}),
}))

const { jwtUtils } = await import('../../../../../src/app/helper/jwt-utils')
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

async function makeLegacyLogsUrl(behavior: UploadLogsBehavior): Promise<string> {
    const legacyToken = await jwtUtils.sign({
        payload: {
            logsFileId: 'file-1',
            projectId: 'proj-1',
            flowRunId: 'run-1',
            behavior,
        },
        key: SECRET,
        expiresInSeconds: 3600,
    })
    return `https://old-api.example.com/v1/flow-runs/logs?token=${legacyToken}`
}

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
        logsUploadUrl: 'placeholder',
        logsFileId: 'file-1',
        ...overrides,
    }
}

describe('jobMigrations reSignLogsUploadUrlWithAudience', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('re-signs logsUploadUrl for EXECUTE_FLOW at schemaVersion 6 and bumps to latest', async () => {
        const logsUploadUrl = await makeLegacyLogsUrl(UploadLogsBehavior.UPLOAD_DIRECTLY)

        const migrated = await jobMigrations(mockLog).apply(baseFlowJob({ logsUploadUrl }))

        expect(mockConstructUploadUrl).toHaveBeenCalledWith({
            logsFileId: 'file-1',
            projectId: 'proj-1',
            flowRunId: 'run-1',
            behavior: UploadLogsBehavior.UPLOAD_DIRECTLY,
        })
        expect(migrated).toMatchObject({
            schemaVersion: TARGET_SCHEMA_VERSION,
            logsUploadUrl: expect.stringContaining('new-api.example.com'),
        })
    })

    it('preserves REDIRECT_TO_S3 behavior from the legacy token', async () => {
        const logsUploadUrl = await makeLegacyLogsUrl(UploadLogsBehavior.REDIRECT_TO_S3)
        const job = baseFlowJob({ logsUploadUrl })

        await jobMigrations(mockLog).apply(job)

        expect(mockConstructUploadUrl).toHaveBeenCalledWith(expect.objectContaining({
            behavior: UploadLogsBehavior.REDIRECT_TO_S3,
        }))
    })

    it('falls back to UPLOAD_DIRECTLY when token cannot be parsed', async () => {
        const job = baseFlowJob({ logsUploadUrl: 'not-a-url-with-token' })

        await jobMigrations(mockLog).apply(job)

        expect(mockConstructUploadUrl).toHaveBeenCalledWith(expect.objectContaining({
            behavior: UploadLogsBehavior.UPLOAD_DIRECTLY,
        }))
    })

    it('falls back to UPLOAD_DIRECTLY when legacy token has an invalid behavior value', async () => {
        const tamperedToken = await jwtUtils.sign({
            payload: {
                logsFileId: 'file-1',
                projectId: 'proj-1',
                flowRunId: 'run-1',
                behavior: 'EVIL_BEHAVIOR',
            },
            key: SECRET,
            expiresInSeconds: 3600,
        })
        const job = baseFlowJob({
            logsUploadUrl: `https://old-api.example.com/v1/flow-runs/logs?token=${tamperedToken}`,
        })

        await jobMigrations(mockLog).apply(job)

        expect(mockConstructUploadUrl).toHaveBeenCalledWith(expect.objectContaining({
            behavior: UploadLogsBehavior.UPLOAD_DIRECTLY,
        }))
    })

    it('bumps schemaVersion without re-signing for non-EXECUTE_FLOW jobs', async () => {
        const migrated = await jobMigrations(mockLog).apply({
            jobType: WorkerJobType.EXECUTE_WEBHOOK,
            schemaVersion: 6,
            projectId: 'proj-1',
            platformId: 'plat-1',
            flowId: 'flow-1',
            requestId: 'req-1',
            payload: { type: 'inline', value: {} },
        })

        expect(mockConstructUploadUrl).not.toHaveBeenCalled()
        expect(migrated).toMatchObject({ schemaVersion: TARGET_SCHEMA_VERSION })
    })

    it('is a no-op when job is already at latest schemaVersion', async () => {
        const migrated = await jobMigrations(mockLog).apply(baseFlowJob({
            schemaVersion: TARGET_SCHEMA_VERSION,
            logsUploadUrl: 'https://ok/v1?token=x',
        }))

        expect(mockConstructUploadUrl).not.toHaveBeenCalled()
        expect(migrated).toMatchObject({ schemaVersion: TARGET_SCHEMA_VERSION })
    })
})

describe('jobMigrations backfillRequiredExecuteFlowFields (v7 -> v8)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('backfills missing streamStepProgress to NONE on v7 EXECUTE_FLOW jobs and bumps to v8', async () => {
        const { streamStepProgress: _omit, ...withoutProgress } = baseFlowJob({ schemaVersion: 7, logsUploadUrl: 'https://ok/v1?token=x' })

        const migrated = await jobMigrations(mockLog).apply(withoutProgress)

        expect(migrated).toMatchObject({
            schemaVersion: TARGET_SCHEMA_VERSION,
            streamStepProgress: StreamStepProgress.NONE,
        })
        expect(JobData.safeParse(migrated).success).toBe(true)
    })

    it('backfills streamStepProgress from legacy progressUpdateType on v7 jobs', async () => {
        const { streamStepProgress: _omit, ...withoutProgress } = baseFlowJob({ schemaVersion: 7, logsUploadUrl: 'https://ok/v1?token=x' })

        const migrated = await jobMigrations(mockLog).apply({ ...withoutProgress, progressUpdateType: 'TEST_FLOW' })

        expect(migrated).toMatchObject({
            schemaVersion: TARGET_SCHEMA_VERSION,
            streamStepProgress: StreamStepProgress.WEBSOCKET,
        })
    })

    it('backfills missing workerHandlerId from legacy synchronousHandlerId on v7 jobs', async () => {
        const { workerHandlerId: _omit, ...withoutWorker } = baseFlowJob({ schemaVersion: 7, logsUploadUrl: 'https://ok/v1?token=x' })

        const migrated = await jobMigrations(mockLog).apply({ ...withoutWorker, synchronousHandlerId: 'handler-1' })

        expect(migrated).toMatchObject({
            schemaVersion: TARGET_SCHEMA_VERSION,
            workerHandlerId: 'handler-1',
        })
    })

    it('preserves existing streamStepProgress when already present on v7 jobs', async () => {
        const migrated = await jobMigrations(mockLog).apply(baseFlowJob({
            schemaVersion: 7,
            streamStepProgress: StreamStepProgress.WEBSOCKET,
            logsUploadUrl: 'https://ok/v1?token=x',
        }))

        expect(migrated).toMatchObject({ streamStepProgress: StreamStepProgress.WEBSOCKET })
    })

    it('bumps schemaVersion without backfilling for non-EXECUTE_FLOW v7 jobs', async () => {
        const migrated = await jobMigrations(mockLog).apply({
            jobType: WorkerJobType.EXECUTE_WEBHOOK,
            schemaVersion: 7,
            projectId: 'proj-1',
            platformId: 'plat-1',
            flowId: 'flow-1',
            requestId: 'req-1',
            payload: { type: 'inline', value: {} },
        })

        expect(mockConstructUploadUrl).not.toHaveBeenCalled()
        expect(migrated).toMatchObject({ schemaVersion: TARGET_SCHEMA_VERSION })
        expect(migrated).not.toHaveProperty('streamStepProgress')
    })

    it('repairs the production poison case (v7 EXECUTE_FLOW with no streamStepProgress nor legacy field) so JobData.parse succeeds', async () => {
        const productionPoisonShape = {
            jobType: WorkerJobType.EXECUTE_FLOW,
            schemaVersion: 7,
            projectId: 'RgJbQBPvuKsHxEf8pYvWH',
            platformId: 'e6o1zp3Md80n0m9zPKs2c',
            flowVersionId: 'z9NHiAw5LYzU3fyl0W6oN',
            flowId: 'flow-x',
            runId: '7o88bEwi3MuYCUJXYer9J',
            environment: RunEnvironment.PRODUCTION,
            executionType: ExecutionType.BEGIN,
            payload: { type: 'inline', value: {} },
            logsFileId: 'file-1',
            logsUploadUrl: 'https://ok/v1?token=x',
        }

        expect(JobData.safeParse(productionPoisonShape).success).toBe(false)

        const migrated = await jobMigrations(mockLog).apply(productionPoisonShape)

        expect(migrated).toMatchObject({ schemaVersion: TARGET_SCHEMA_VERSION })
        expect(JobData.safeParse(migrated).success).toBe(true)
    })
})
