import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ActivepiecesError, ErrorCode } from '@activepieces/core-utils';
import { EngineResponseStatus, ExecutionType, FlowActionType, FlowRunStatus, FlowTriggerType, FlowVersionState, StreamStepProgress, RunEnvironment, WorkerJobType } from '@activepieces/shared';
import type { ExecuteFlowJobData, FlowVersion } from '@activepieces/shared'

vi.mock('../../../../src/lib/config/worker-settings', () => ({
    workerSettings: {
        getSettings: vi.fn().mockReturnValue({ FLOW_TIMEOUT_SECONDS: 600 }),
    },
}))

import { executeFlowJob } from '../../../../src/lib/execute/jobs/execute-flow'
import { JobResultKind } from '../../../../src/lib/execute/types'

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
            displayName: 'Gmail Trigger',
            lastUpdatedDate: '2024-01-01T00:00:00Z',
            type: FlowTriggerType.PIECE,
            settings: {
                pieceName: '@activepieces/piece-gmail',
                pieceVersion: '~0.1.0',
                triggerName: 'new_email',
                input: {},
                propertySettings: {},
            },
            nextAction: {
                name: 'step_1',
                valid: true,
                displayName: 'Slack Action',
                lastUpdatedDate: '2024-01-01T00:00:00Z',
                type: FlowActionType.PIECE,
                settings: {
                    pieceName: '@activepieces/piece-slack',
                    pieceVersion: '~0.2.0',
                    actionName: 'send_message',
                    input: {},
                    propertySettings: {},
                },
            },
        },
        updatedBy: null,
        valid: true,
        schemaVersion: null,
        agentIds: [],
        state: FlowVersionState.DRAFT,
        connectionIds: [],
        backupFiles: null,
        notes: [],
    }
}

function makeResumeJobData(overrides?: Partial<ExecuteFlowJobData>): ExecuteFlowJobData {
    return {
        projectId: 'proj-1',
        platformId: 'plat-1',
        jobType: WorkerJobType.EXECUTE_FLOW,
        environment: RunEnvironment.PRODUCTION,
        schemaVersion: 4,
        flowId: 'flow-1',
        flowVersionId: 'fv-1',
        runId: 'run-1',
        payload: { type: 'inline', value: {} },
        executionType: ExecutionType.RESUME,
        streamStepProgress: StreamStepProgress.NONE,
        logsUploadUrl: 'http://example.com/upload',
        logsFileId: 'logs-file-1',
        ...overrides,
    }
}

// The flow handler now drives ctx.resolver.resolve(...) (which resolves the flow + pieces and
// returns { kind, provision, flowVersion }) followed by ctx.runtime.execute(...), so the test mocks
// the resolver and runtime directly.
function makeMockContext(opts?: { resolveResult?: unknown, apiOverrides?: Record<string, vi.Mock> }) {
    const resolver = {
        resolve: vi.fn().mockResolvedValue(
            opts?.resolveResult ?? {
                kind: 'ready',
                provision: { platformId: 'plat-1', pieces: [], codes: [], publicApiUrl: 'http://localhost:3000/api/', engineToken: 'test-token' },
                flowVersion: makeFlowVersion(),
            },
        ),
    }
    const runtime = {
        execute: vi.fn().mockResolvedValue({ status: 'OK' }),
    }
    return {
        log: {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
        },
        apiClient: {
            uploadRunLog: vi.fn(),
            ...opts?.apiOverrides,
        },
        resolver,
        runtime,
        workerIndex: 0,
        engineToken: 'test-token',
        internalApiUrl: 'http://localhost:3000',
        publicApiUrl: 'http://localhost:4200',
    } as any
}

describe('executeFlowJob', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('payload pass-through (no worker-side fetch)', () => {
        it('forwards the JobPayload ref unchanged to the engine for BEGIN', async () => {
            const ctx = makeMockContext()
            const data = makeResumeJobData({
                executionType: ExecutionType.BEGIN,
                payload: { type: 'ref', fileId: 'huge-file-1' },
            })

            await executeFlowJob.execute(ctx, data)

            const operation = ctx.runtime.execute.mock.calls[0][0].operation
            expect(operation.executionType).toBe(ExecutionType.BEGIN)
            expect(operation.triggerPayload).toEqual({ type: 'ref', fileId: 'huge-file-1' })
            expect(operation.executionState).toBeUndefined()
        })

        it('forwards the JobPayload ref unchanged to the engine for RESUME and never reads logsFileId', async () => {
            const ctx = makeMockContext()
            const data = makeResumeJobData({
                payload: { type: 'ref', fileId: 'resume-payload-1' },
                logsFileId: 'logs-file-1',
            })

            await executeFlowJob.execute(ctx, data)

            const operation = ctx.runtime.execute.mock.calls[0][0].operation
            expect(operation.executionType).toBe(ExecutionType.RESUME)
            expect(operation.resumePayload).toEqual({ type: 'ref', fileId: 'resume-payload-1' })
            expect(operation.logsFileId).toBe('logs-file-1')
            expect(operation.executionState).toBeUndefined()
        })
    })

    describe('RESUME validation', () => {
        it('still throws when logsFileId is missing for RESUME', async () => {
            const ctx = makeMockContext()
            const data = makeResumeJobData({ logsFileId: undefined as unknown as string })

            try {
                await executeFlowJob.execute(ctx, data)
                expect.fail('should have thrown')
            }
            catch (e) {
                expect(e).toBeInstanceOf(ActivepiecesError)
                expect((e as ActivepiecesError).error.code).toBe(ErrorCode.RESUME_LOGS_FILE_MISSING)
            }

            expect(ctx.apiClient.uploadRunLog).toHaveBeenCalledWith(
                expect.objectContaining({ status: FlowRunStatus.INTERNAL_ERROR }),
            )
        })
    })

    describe('missing piece handling', () => {
        it('marks run as FAILED and never runs the engine when the flow version is not found', async () => {
            const ctx = makeMockContext({ resolveResult: { kind: 'flow-not-found' } })
            const data = makeResumeJobData({ executionType: ExecutionType.BEGIN })

            const result = await executeFlowJob.execute(ctx, data)

            expect(result.kind).toBe(JobResultKind.FIRE_AND_FORGET)
            // Run is FAILED, but the job COMPLETES (OK) — a missing flow must not fail+retry+page the job.
            expect(result.status).toBe(EngineResponseStatus.OK)

            expect(ctx.apiClient.uploadRunLog).toHaveBeenCalledWith(
                expect.objectContaining({ status: FlowRunStatus.FAILED }),
            )

            // No sandbox work happens for a missing flow: provision returns early, run is never called.
            expect(ctx.runtime.execute).not.toHaveBeenCalled()
        })

        it('marks run as FAILED and completes the job (OK) when the flow is disabled', async () => {
            const ctx = makeMockContext({ resolveResult: { kind: 'disabled' } })
            const data = makeResumeJobData({ executionType: ExecutionType.BEGIN })

            const result = await executeFlowJob.execute(ctx, data)

            expect(result.kind).toBe(JobResultKind.FIRE_AND_FORGET)
            expect(result.status).toBe(EngineResponseStatus.OK)
            expect(ctx.apiClient.uploadRunLog).toHaveBeenCalledWith(
                expect.objectContaining({ status: FlowRunStatus.FAILED }),
            )
            expect(ctx.runtime.execute).not.toHaveBeenCalled()
        })
    })
})
