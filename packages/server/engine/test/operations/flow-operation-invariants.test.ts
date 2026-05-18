import { describe, it, expect, vi } from 'vitest'
import {
    EngineGenericError,
    ExecutionType,
    FlowTriggerType,
    FlowVersionState,
    StreamStepProgress,
    RunEnvironment,
    StepOutputStatus,
} from '@activepieces/shared'
import type { BeginExecuteFlowOperation, FlowVersion, ResumeExecuteFlowOperation } from '@activepieces/shared'

vi.mock('../../src/lib/helper/flow-run-progress-reporter', () => ({
    flowRunProgressReporter: {
        sendUpdate: vi.fn().mockResolvedValue(undefined),
        backup: vi.fn().mockResolvedValue(undefined),
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

    describe('BEGIN payload hydration', () => {
        it('inline payload is forwarded without calling getPayloadFile', async () => {
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
