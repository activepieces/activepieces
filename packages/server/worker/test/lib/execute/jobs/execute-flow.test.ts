import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    ActivepiecesError,
    ErrorCode,
    ExecutionType,
    FlowActionType,
    FlowRunStatus,
    FlowTriggerType,
    FlowVersionState,
    StreamStepProgress,
    RunEnvironment,
    StepOutputStatus,
    WorkerJobType,
} from '@activepieces/shared'
import type { ExecuteFlowJobData, FlowVersion } from '@activepieces/shared'

const mockGetVersion = vi.fn()

vi.mock('../../../../src/lib/cache/flow/flow-cache', () => ({
    flowCache: () => ({
        getVersion: mockGetVersion,
    }),
}))

vi.mock('../../../../src/lib/config/worker-settings', () => ({
    workerSettings: {
        getSettings: vi.fn().mockReturnValue({ FLOW_TIMEOUT_SECONDS: 600 }),
    },
}))

vi.mock('../../../../src/lib/execute/utils/flow-helpers', () => ({
    provisionFlowPieces: vi.fn().mockResolvedValue(true),
}))

vi.mock('../../../../src/lib/execute/utils/resolve-payload', () => ({
    resolvePayload: vi.fn().mockImplementation((payload: unknown) => Promise.resolve(payload)),
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
        payload: {},
        executionType: ExecutionType.RESUME,
        streamStepProgress: StreamStepProgress.NONE,
        logsUploadUrl: 'http://example.com/upload',
        logsFileId: 'logs-file-1',
        ...overrides,
    }
}

function makeMockContext(apiOverrides?: Record<string, vi.Mock>) {
    const mockSandbox = {
        start: vi.fn(),
        execute: vi.fn().mockResolvedValue({ engine: { status: 'OK' } }),
    }
    return {
        log: {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
        },
        apiClient: {
            getPayloadFile: vi.fn(),
            uploadRunLog: vi.fn(),
            ...apiOverrides,
        },
        sandboxManager: {
            acquire: vi.fn().mockReturnValue(mockSandbox),
            release: vi.fn(),
            invalidate: vi.fn(),
        },
        engineToken: 'test-token',
        internalApiUrl: 'http://localhost:3000',
        publicApiUrl: 'http://localhost:4200',
    } as any
}

describe('executeFlowJob', () => {
    beforeEach(() => {
        mockGetVersion.mockResolvedValue(makeFlowVersion())
    })

    describe('RESUME execution state validation', () => {
        it('should throw VALIDATION error when RESUME has empty execution state', async () => {
            const ctx = makeMockContext()
            ctx.apiClient.getPayloadFile.mockResolvedValue(
                Buffer.from(JSON.stringify({ executionState: { steps: {}, tags: [] } })),
            )

            const data = makeResumeJobData()

            try {
                await executeFlowJob.execute(ctx, data)
                expect.fail('should have thrown')
            }
            catch (e) {
                expect(e).toBeInstanceOf(ActivepiecesError)
                expect((e as ActivepiecesError).error.code).toBe(ErrorCode.VALIDATION)
            }

            expect(ctx.log.error).toHaveBeenCalledWith(
                expect.objectContaining({ runId: 'run-1' }),
                expect.stringContaining('empty execution state'),
            )

            expect(ctx.apiClient.uploadRunLog).toHaveBeenCalledWith(
                expect.objectContaining({ status: FlowRunStatus.INTERNAL_ERROR }),
            )
        })

        it('should proceed normally when RESUME has non-empty execution state', async () => {
            const ctx = makeMockContext()
            ctx.apiClient.getPayloadFile.mockResolvedValue(
                Buffer.from(JSON.stringify({
                    executionState: {
                        steps: {
                            trigger_1: {
                                type: FlowTriggerType.EMPTY,
                                status: StepOutputStatus.SUCCEEDED,
                                input: {},
                                output: {},
                            },
                        },
                        tags: [],
                    },
                })),
            )

            const data = makeResumeJobData()
            const result = await executeFlowJob.execute(ctx, data)

            expect(result).toBeDefined()
            expect(ctx.apiClient.uploadRunLog).not.toHaveBeenCalledWith(
                expect.objectContaining({ status: FlowRunStatus.INTERNAL_ERROR }),
            )
        })
    })

    describe('missing piece handling', () => {
        it('should mark run as FAILED and skip sandbox when flow version is not found (missing piece)', async () => {
            mockGetVersion.mockResolvedValue(null)

            const ctx = makeMockContext()
            const data = makeResumeJobData({ executionType: ExecutionType.BEGIN })

            const result = await executeFlowJob.execute(ctx, data)

            expect(result.kind).toBe(JobResultKind.FIRE_AND_FORGET)

            expect(ctx.apiClient.uploadRunLog).toHaveBeenCalledWith(
                expect.objectContaining({ status: FlowRunStatus.FAILED }),
            )

            expect(ctx.sandboxManager.acquire).not.toHaveBeenCalled()
        })
    })
})
