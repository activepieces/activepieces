import { describe, it, expect, vi } from 'vitest'
import {
    EngineGenericError,
    ExecutionType,
    FlowActionType,
    FlowTriggerType,
    FlowVersionState,
    ResumeReason,
    StreamStepProgress,
    RunEnvironment,
    StepOutputStatus,
} from '@activepieces/shared'
import type { BeginExecuteFlowOperation, FlowAction, FlowVersion, ResumeExecuteFlowOperation } from '@activepieces/shared'

vi.mock('../../src/lib/helper/flow-run-progress-reporter', () => ({
    flowRunProgressReporter: {
        sendUpdate: vi.fn().mockResolvedValue(undefined),
        backup: vi.fn().mockResolvedValue(undefined),
        createOutputContext: vi.fn().mockReturnValue({ update: vi.fn().mockResolvedValue(undefined) }),
    },
}))

const { mockDownload, mockUpload } = vi.hoisted(() => ({
    mockDownload: vi.fn(),
    mockUpload: vi.fn(),
}))
vi.mock('../../src/lib/engine-file-api', () => ({
    engineFileApi: {
        download: mockDownload,
        upload: mockUpload,
    },
}))

const { mockCreateWaitpoint } = vi.hoisted(() => ({
    mockCreateWaitpoint: vi.fn(),
}))
vi.mock('../../src/lib/piece-context/waitpoint-client', () => ({
    waitpointClient: {
        create: mockCreateWaitpoint,
    },
}))

import { flowOperation } from '../../src/lib/operations/flow.operation'

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
            displayName: 'Test Trigger',
            type: FlowTriggerType.EMPTY,
            settings: {},
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

function makeBeginOperation(overrides?: Partial<BeginExecuteFlowOperation>): BeginExecuteFlowOperation {
    return {
        projectId: 'proj-1',
        engineToken: 'test-token',
        internalApiUrl: 'http://localhost:3000/',
        publicApiUrl: 'http://localhost:4200/api/',
        timeoutInSeconds: 600,
        platformId: 'plat-1',
        flowVersion: makeFlowVersion(),
        flowRunId: 'run-1',
        executionType: ExecutionType.BEGIN,
        runEnvironment: RunEnvironment.TESTING,
        workerHandlerId: null,
        httpRequestId: null,
        streamStepProgress: StreamStepProgress.NONE,
        stepNameToTest: null,
        triggerPayload: { type: 'inline', value: {} },
        executeTrigger: false,
        ...overrides,
    }
}

function makeFlowVersionWithTwoApprovals(): FlowVersion {
    const step2: FlowAction = {
        name: 'step_2',
        displayName: 'Step 2 — Wait for Approval',
        type: FlowActionType.PIECE,
        skip: false,
        valid: true,
        settings: {
            input: {},
            pieceName: '@activepieces/piece-approval',
            pieceVersion: '1.0.0',
            actionName: 'wait_for_approval',
            propertySettings: {},
        },
    }
    const step1: FlowAction = {
        name: 'step_1',
        displayName: 'Step 1 — Wait for Approval',
        type: FlowActionType.PIECE,
        skip: false,
        valid: true,
        settings: {
            input: {},
            pieceName: '@activepieces/piece-approval',
            pieceVersion: '1.0.0',
            actionName: 'wait_for_approval',
            propertySettings: {},
            errorHandlingOptions: {
                continueOnFailure: { value: true },
                retryOnFailure: { value: false },
            },
        },
        nextAction: step2,
    }
    return {
        ...makeFlowVersion(),
        trigger: {
            name: 'trigger_1',
            valid: true,
            displayName: 'Test Trigger',
            type: FlowTriggerType.EMPTY,
            settings: {},
            nextAction: step1,
        },
    }
}

function makeResumeOperation(overrides?: Partial<ResumeExecuteFlowOperation>): ResumeExecuteFlowOperation {
    return {
        projectId: 'proj-1',
        engineToken: 'test-token',
        internalApiUrl: 'http://localhost:3000/',
        publicApiUrl: 'http://localhost:4200/api/',
        timeoutInSeconds: 600,
        platformId: 'plat-1',
        flowVersion: makeFlowVersion(),
        flowRunId: 'run-1',
        executionType: ExecutionType.RESUME,
        runEnvironment: RunEnvironment.TESTING,
        workerHandlerId: null,
        httpRequestId: null,
        streamStepProgress: StreamStepProgress.NONE,
        stepNameToTest: null,
        resumePayload: { type: 'inline', value: { data: {} } },
        resumeReason: ResumeReason.WAITPOINT,
        logsFileId: 'logs-file-1',
        ...overrides,
    }
}

describe('flow operation invariants', () => {
    describe('RESUME execution state hydration', () => {
        it('throws EngineGenericError when RESUME has empty execution state in logs file', async () => {
            mockDownload.mockReset()
            mockDownload.mockResolvedValue(
                new TextEncoder().encode(JSON.stringify({ executionState: { steps: {}, tags: [] } })),
            )

            const operation = makeResumeOperation()

            await expect(flowOperation.execute(operation)).rejects.toThrow(EngineGenericError)
            await expect(flowOperation.execute(operation)).rejects.toThrow('RESUME operation received with empty execution state')
        })

        it('throws when logsFileId is missing on RESUME', async () => {
            mockDownload.mockReset()
            const operation = makeResumeOperation({ logsFileId: undefined })

            await expect(flowOperation.execute(operation)).rejects.toThrow(EngineGenericError)
            await expect(flowOperation.execute(operation)).rejects.toThrow('logsFileId is missing for RESUME operation')
        })

        it('throws when executionState is missing in logs file', async () => {
            mockDownload.mockReset()
            mockDownload.mockResolvedValue(new TextEncoder().encode(JSON.stringify({})))

            const operation = makeResumeOperation()

            await expect(flowOperation.execute(operation)).rejects.toThrow(EngineGenericError)
            await expect(flowOperation.execute(operation)).rejects.toThrow('executionState is missing in logs file')
        })

        it('proceeds past hydration when logs file has non-empty execution state', async () => {
            mockDownload.mockReset()
            mockDownload.mockResolvedValue(
                new TextEncoder().encode(JSON.stringify({
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

            const operation = makeResumeOperation()

            try {
                await flowOperation.execute(operation)
            }
            catch (e) {
                expect((e as Error).message).not.toContain('empty execution state')
                expect((e as Error).message).not.toContain('logsFileId is missing')
                expect((e as Error).message).not.toContain('executionState is missing')
            }
        })
    })

    describe('RESUME step-restoration semantics', () => {
        it('preserves FAILED steps on a waitpoint resume (resumePayload present)', async () => {
            // Regression for the Slack/webhook-resume bug: a FAILED step preserved by
            // `continueOnFailure` was being dropped from the restored journal on resume.
            // The engine then re-executed it from BEGIN, creating a fresh waitpoint and
            // (for Call Flow) re-invoking the subflow. That cascade is what eventually
            // let the global resumePayload pollute downstream paused steps.
            //
            // Setup: trigger → step_1 (FAILED with continueOnFailure) → step_2 (PAUSED waiting
            // for a webhook click). Resume is fired for step_2 with a non-null resumePayload
            // (waitpoint path). With the fix, step_1 stays FAILED in the restored state,
            // `isCompleted` short-circuits piece-executor, and no new waitpoint is created.
            mockDownload.mockReset()
            mockCreateWaitpoint.mockReset()
            mockCreateWaitpoint.mockResolvedValue({
                id: 'wp-new',
                resumeUrl: 'http://localhost:4200/api/v1/flow-runs/run-1/waitpoints/wp-new',
            })

            mockDownload.mockResolvedValue(
                new TextEncoder().encode(JSON.stringify({
                    executionState: {
                        steps: {
                            trigger_1: {
                                type: FlowTriggerType.EMPTY,
                                status: StepOutputStatus.SUCCEEDED,
                                input: {},
                                output: {},
                            },
                            step_1: {
                                type: FlowActionType.PIECE,
                                status: StepOutputStatus.FAILED,
                                input: {},
                                errorMessage: 'Subflow execution failed',
                            },
                            step_2: {
                                type: FlowActionType.PIECE,
                                status: StepOutputStatus.PAUSED,
                                input: {},
                                output: { approved: true },
                            },
                        },
                        tags: [],
                    },
                })),
            )

            const operation: ResumeExecuteFlowOperation = {
                ...makeResumeOperation(),
                flowVersion: makeFlowVersionWithTwoApprovals(),
                resumePayload: {
                    type: 'inline',
                    value: { queryParams: { action: 'approve' }, body: {}, headers: {} },
                },
            }

            await flowOperation.execute(operation)

            expect(mockCreateWaitpoint).not.toHaveBeenCalled()
        })

        it('drops FAILED steps on a retry resume (resumeReason=RETRY — FlowRetryStrategy.FROM_FAILED_STEP)', async () => {
            // The retry-from-failed-step feature (flow-run-service.ts FlowRetryStrategy.FROM_FAILED_STEP)
            // re-enqueues the run as executionType=RESUME with resumeReason=RETRY, expecting the
            // engine to replay the failed step. Preserving FAILED on this path would silently turn
            // retry into a no-op. The discriminator is the explicit `resumeReason` field.
            mockDownload.mockReset()
            mockCreateWaitpoint.mockReset()
            mockCreateWaitpoint.mockResolvedValue({
                id: 'wp-retry',
                resumeUrl: 'http://localhost:4200/api/v1/flow-runs/run-1/waitpoints/wp-retry',
            })

            mockDownload.mockResolvedValue(
                new TextEncoder().encode(JSON.stringify({
                    executionState: {
                        steps: {
                            trigger_1: {
                                type: FlowTriggerType.EMPTY,
                                status: StepOutputStatus.SUCCEEDED,
                                input: {},
                                output: {},
                            },
                            step_1: {
                                type: FlowActionType.PIECE,
                                status: StepOutputStatus.FAILED,
                                input: {},
                                errorMessage: 'transient error',
                            },
                        },
                        tags: [],
                    },
                })),
            )

            const operation: ResumeExecuteFlowOperation = {
                ...makeResumeOperation(),
                flowVersion: makeFlowVersionWithTwoApprovals(),
                resumePayload: { type: 'inline', value: null },
                resumeReason: ResumeReason.RETRY,
            }

            await flowOperation.execute(operation)

            // step_1 (FAILED) was dropped because resumeReason=RETRY → engine replayed it from
            // BEGIN, which creates a waitpoint via the approval piece.
            expect(mockCreateWaitpoint).toHaveBeenCalled()
        })

        it('drops non-terminal statuses (e.g. RUNNING from a mid-step crash) on any resume', async () => {
            // Sanity check on the inverse direction: a step left in RUNNING (engine crash mid-step,
            // never reached a terminal status) should still be replayed on resume, regardless of
            // whether resumePayload is present. Only SUCCEEDED, PAUSED, and FAILED (the last
            // conditionally) survive restoration.
            mockDownload.mockReset()
            mockCreateWaitpoint.mockReset()
            mockCreateWaitpoint.mockResolvedValue({
                id: 'wp-replay',
                resumeUrl: 'http://localhost:4200/api/v1/flow-runs/run-1/waitpoints/wp-replay',
            })

            mockDownload.mockResolvedValue(
                new TextEncoder().encode(JSON.stringify({
                    executionState: {
                        steps: {
                            trigger_1: {
                                type: FlowTriggerType.EMPTY,
                                status: StepOutputStatus.SUCCEEDED,
                                input: {},
                                output: {},
                            },
                            step_1: {
                                type: FlowActionType.PIECE,
                                status: StepOutputStatus.RUNNING,
                                input: {},
                            },
                            step_2: {
                                type: FlowActionType.PIECE,
                                status: StepOutputStatus.PAUSED,
                                input: {},
                                output: { approved: true },
                            },
                        },
                        tags: [],
                    },
                })),
            )

            const operation: ResumeExecuteFlowOperation = {
                ...makeResumeOperation(),
                flowVersion: makeFlowVersionWithTwoApprovals(),
                resumePayload: {
                    type: 'inline',
                    value: { queryParams: { action: 'approve' }, body: {}, headers: {} },
                },
            }

            await flowOperation.execute(operation)

            expect(mockCreateWaitpoint).toHaveBeenCalledTimes(1)
        })

        it('preserves FAILED steps on a delay-piece waitpoint resume even though resumePayload is null', async () => {
            // The Delay piece's scheduled resume (`flow-run-module.ts` RESUME_DELAY_WAITPOINT
            // handler) calls `resumeFromWaitpoint` with `resumePayload: null`. Prior to the
            // explicit `resumeReason` field this looked indistinguishable from a retry, and the
            // engine would drop FAILED — replaying any `continueOnFailure` step that preceded
            // the delay. With `resumeReason: WAITPOINT`, FAILED is preserved correctly.
            mockDownload.mockReset()
            mockCreateWaitpoint.mockReset()
            mockCreateWaitpoint.mockResolvedValue({
                id: 'wp-delay',
                resumeUrl: 'http://localhost:4200/api/v1/flow-runs/run-1/waitpoints/wp-delay',
            })

            mockDownload.mockResolvedValue(
                new TextEncoder().encode(JSON.stringify({
                    executionState: {
                        steps: {
                            trigger_1: {
                                type: FlowTriggerType.EMPTY,
                                status: StepOutputStatus.SUCCEEDED,
                                input: {},
                                output: {},
                            },
                            step_1: {
                                type: FlowActionType.PIECE,
                                status: StepOutputStatus.FAILED,
                                input: {},
                                errorMessage: 'Subflow execution failed',
                            },
                            step_2: {
                                type: FlowActionType.PIECE,
                                status: StepOutputStatus.PAUSED,
                                input: {},
                                output: {},
                            },
                        },
                        tags: [],
                    },
                })),
            )

            const operation: ResumeExecuteFlowOperation = {
                ...makeResumeOperation(),
                flowVersion: makeFlowVersionWithTwoApprovals(),
                resumePayload: { type: 'inline', value: null },
                resumeReason: ResumeReason.WAITPOINT,
            }

            await flowOperation.execute(operation)

            expect(mockCreateWaitpoint).not.toHaveBeenCalled()
        })
    })

    describe('BEGIN payload hydration', () => {
        it('inline payload is forwarded without hitting the engine file client', async () => {
            mockDownload.mockReset()
            const operation = makeBeginOperation({
                triggerPayload: { type: 'inline', value: { hello: 'world' } },
            })

            try {
                await flowOperation.execute(operation)
            }
            catch {
                // downstream may fail; we only assert RPC call shape
            }

            expect(mockDownload).not.toHaveBeenCalled()
        })

        it('ref payload is fetched via the engine HTTP client', async () => {
            mockDownload.mockReset()
            mockDownload.mockResolvedValue(new TextEncoder().encode(JSON.stringify({ hello: 'ref' })))
            const operation = makeBeginOperation({
                triggerPayload: { type: 'ref', fileId: 'payload-file-1' },
            })

            try {
                await flowOperation.execute(operation)
            }
            catch {
                // downstream may fail; we only assert RPC call shape
            }

            expect(mockDownload).toHaveBeenCalledWith({
                apiUrl: 'http://localhost:3000/',
                engineToken: 'test-token',
                fileId: 'payload-file-1',
            })
        })
    })
})
