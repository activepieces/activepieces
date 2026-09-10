import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ActivepiecesError, ErrorCode } from '@activepieces/core-utils'
import { EngineResponseStatus, FlowTriggerType, FlowVersionState, RunEnvironment, TriggerRunStatus, WorkerJobType } from '@activepieces/shared'
import type { FlowVersion, WebhookJobData } from '@activepieces/shared'

vi.mock('../../../../src/lib/config/worker-settings', () => ({
    workerSettings: {
        getSettings: vi.fn().mockReturnValue({ TRIGGER_TIMEOUT_SECONDS: 30, APP_WEBHOOK_SECRETS: '{}' }),
    },
}))

import { executeWebhookJob } from '../../../../src/lib/execute/jobs/execute-webhook'
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
            displayName: 'Catch Webhook',
            lastUpdatedDate: '2024-01-01T00:00:00Z',
            type: FlowTriggerType.PIECE,
            settings: {
                pieceName: '@activepieces/piece-webhook',
                pieceVersion: '~0.1.0',
                triggerName: 'catch_webhook',
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

function makeWebhookJobData(overrides?: Partial<WebhookJobData>): WebhookJobData {
    return {
        projectId: 'proj-1',
        platformId: 'plat-1',
        schemaVersion: 4,
        requestId: 'req-1',
        payload: { type: 'inline', value: {} },
        runEnvironment: RunEnvironment.PRODUCTION,
        flowId: 'flow-1',
        saveSampleData: false,
        flowVersionIdToRun: 'fv-1',
        execute: true,
        jobType: WorkerJobType.EXECUTE_WEBHOOK,
        ...overrides,
    }
}

function makeMockContext(opts?: { executeResult?: unknown, executeError?: unknown }): JobContext {
    const runtime = {
        execute: opts?.executeError
            ? vi.fn().mockRejectedValue(opts.executeError)
            : vi.fn().mockResolvedValue(opts?.executeResult ?? { status: EngineResponseStatus.OK, response: { output: [{}] } }),
    }
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
            savePayloads: vi.fn(),
            recordTriggerRun: vi.fn(),
        },
        resolver: {
            resolve: vi.fn().mockResolvedValue({
                kind: 'ready',
                provision: { platformId: 'plat-1', pieces: [], codes: [], publicApiUrl: 'http://localhost:3000/api/', engineToken: 'test-token' },
                flowVersion: makeFlowVersion(),
            }),
        },
        runtime,
        workerIndex: 0,
        engineToken: 'test-token',
        internalApiUrl: 'http://localhost:3000',
        publicApiUrl: 'http://localhost:4200',
    } as unknown as JobContext
}

const expectedBaseFields = {
    webhook: { requestId: 'req-1' },
    flow: { id: 'flow-1' },
    flowVersion: { id: 'fv-1' },
    project: { id: 'proj-1' },
}

describe('executeWebhookJob silent-drop visibility', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('logs at error level with the engine error on a non-user engine failure, records the failed trigger run, and still completes OK', async () => {
        const ctx = makeMockContext({ executeResult: { status: EngineResponseStatus.INTERNAL_ERROR, response: undefined, error: 'engine exploded', logs: 'engine-log-output' } })

        const result = await executeWebhookJob.execute(ctx, makeWebhookJobData())

        expect(ctx.apiClient.submitPayloads).not.toHaveBeenCalled()
        expect(ctx.log.error).toHaveBeenCalledWith(
            expect.objectContaining({
                ...expectedBaseFields,
                engine: { status: EngineResponseStatus.INTERNAL_ERROR, error: 'engine exploded' },
            }),
            expect.stringContaining('no flow run created'),
        )
        expect(ctx.apiClient.recordTriggerRun).toHaveBeenCalledWith(
            expect.objectContaining({ status: TriggerRunStatus.FAILED }),
        )
        expect(result).toEqual({ kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK, logs: 'engine-log-output' })
    })

    it('logs at warn level when the trigger hook fails with USER_FAILURE', async () => {
        const ctx = makeMockContext({ executeResult: { status: EngineResponseStatus.USER_FAILURE, response: undefined, error: 'trigger threw' } })

        const result = await executeWebhookJob.execute(ctx, makeWebhookJobData())

        expect(ctx.apiClient.submitPayloads).not.toHaveBeenCalled()
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

    it('logs at info level when the trigger returns an empty output and no run is created', async () => {
        const ctx = makeMockContext({ executeResult: { status: EngineResponseStatus.OK, response: { output: [] } } })

        const result = await executeWebhookJob.execute(ctx, makeWebhookJobData())

        expect(ctx.apiClient.submitPayloads).not.toHaveBeenCalled()
        expect(ctx.log.info).toHaveBeenCalledWith(
            expect.objectContaining(expectedBaseFields),
            expect.stringContaining('no payloads'),
        )
        expect(result).toMatchObject({ kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK })
    })

    it('logs at error level on sandbox timeout during real execution and still completes OK', async () => {
        const timeoutError = new ActivepiecesError({
            code: ErrorCode.SANDBOX_EXECUTION_TIMEOUT,
            params: { standardOutput: '', standardError: '' },
        })
        const ctx = makeMockContext({ executeError: timeoutError })

        const result = await executeWebhookJob.execute(ctx, makeWebhookJobData())

        expect(ctx.apiClient.submitPayloads).not.toHaveBeenCalled()
        expect(ctx.log.error).toHaveBeenCalledWith(
            expect.objectContaining(expectedBaseFields),
            expect.stringContaining('timed out'),
        )
        expect(ctx.apiClient.recordTriggerRun).toHaveBeenCalledWith(
            expect.objectContaining({ status: TriggerRunStatus.FAILED }),
        )
        expect(result).toEqual({ kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK })
    })

    it('keeps sandbox timeout at warn level for a sample-only capture where no run was expected', async () => {
        const timeoutError = new ActivepiecesError({
            code: ErrorCode.SANDBOX_EXECUTION_TIMEOUT,
            params: { standardOutput: '', standardError: '' },
        })
        const ctx = makeMockContext({ executeError: timeoutError })

        const result = await executeWebhookJob.execute(ctx, makeWebhookJobData({ saveSampleData: true, execute: false }))

        expect(ctx.log.error).not.toHaveBeenCalled()
        expect(ctx.log.warn).toHaveBeenCalledWith(
            expect.objectContaining(expectedBaseFields),
            expect.stringContaining('timed out'),
        )
        expect(result).toEqual({ kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK })
    })

    it('submits payloads and logs no error on the happy path', async () => {
        const ctx = makeMockContext()

        const result = await executeWebhookJob.execute(ctx, makeWebhookJobData())

        expect(ctx.apiClient.submitPayloads).toHaveBeenCalledOnce()
        expect(ctx.apiClient.submitPayloads).toHaveBeenCalledWith(expect.objectContaining({ httpRequestId: 'req-1', flowVersionId: 'fv-1' }))
        expect(ctx.log.error).not.toHaveBeenCalled()
        expect(ctx.log.warn).not.toHaveBeenCalled()
        expect(result).toMatchObject({ kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK })
    })
})
