import { ExecuteFlowJobData, UploadLogsBehavior, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const TARGET_SCHEMA_VERSION = 7

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

function baseFlowJob(overrides?: Partial<ExecuteFlowJobData>): ExecuteFlowJobData {
    return {
        jobType: WorkerJobType.EXECUTE_FLOW,
        schemaVersion: 6,
        projectId: 'proj-1',
        platformId: 'plat-1',
        flowId: 'flow-1',
        flowVersionId: 'fv-1',
        runId: 'run-1',
        environment: 'PRODUCTION',
        executionType: 'BEGIN',
        streamStepProgress: 'NONE',
        payload: { type: 'inline', value: {} },
        logsUploadUrl: 'placeholder',
        logsFileId: 'file-1',
        ...overrides,
    } as unknown as ExecuteFlowJobData
}

describe('jobMigrations reSignLogsUploadUrlWithAudience', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('re-signs logsUploadUrl for EXECUTE_FLOW at schemaVersion 6 and bumps to latest', async () => {
        const logsUploadUrl = await makeLegacyLogsUrl(UploadLogsBehavior.UPLOAD_DIRECTLY)
        const job = baseFlowJob({ logsUploadUrl })

        const migrated = await jobMigrations(mockLog).apply(job) as ExecuteFlowJobData

        expect(mockConstructUploadUrl).toHaveBeenCalledWith({
            logsFileId: 'file-1',
            projectId: 'proj-1',
            flowRunId: 'run-1',
            behavior: UploadLogsBehavior.UPLOAD_DIRECTLY,
        })
        expect(migrated.logsUploadUrl).toContain('new-api.example.com')
        expect(migrated.schemaVersion).toBe(TARGET_SCHEMA_VERSION)
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

    it('bumps schemaVersion without re-signing for non-EXECUTE_FLOW jobs', async () => {
        const webhookJob = {
            jobType: WorkerJobType.EXECUTE_WEBHOOK,
            schemaVersion: 6,
            projectId: 'proj-1',
            platformId: 'plat-1',
            flowId: 'flow-1',
            requestId: 'req-1',
            payload: { type: 'inline', value: {} },
        } as unknown as ExecuteFlowJobData

        const migrated = await jobMigrations(mockLog).apply(webhookJob)

        expect(mockConstructUploadUrl).not.toHaveBeenCalled()
        expect((migrated as { schemaVersion: number }).schemaVersion).toBe(TARGET_SCHEMA_VERSION)
    })

    it('is a no-op when job is already at latest schemaVersion', async () => {
        const job = baseFlowJob({ schemaVersion: TARGET_SCHEMA_VERSION, logsUploadUrl: 'https://ok/v1?token=x' })

        const migrated = await jobMigrations(mockLog).apply(job) as ExecuteFlowJobData

        expect(mockConstructUploadUrl).not.toHaveBeenCalled()
        expect(migrated.schemaVersion).toBe(TARGET_SCHEMA_VERSION)
    })
})
