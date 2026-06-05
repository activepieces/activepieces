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
import type { BeginExecuteFlowOperation, ResumeExecuteFlowOperation, FlowVersion } from '@activepieces/shared'

vi.mock('../../src/lib/handler/run-progress', () => ({
    runProgressService: {
        backup: vi.fn(),
    },
}))

const { mockDownload } = vi.hoisted(() => ({
    mockDownload: vi.fn(),
}))
vi.mock('../../src/lib/engine-file-api', () => ({
    engineFileApi: {
        download: mockDownload,
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
        executionState: { steps: {}, tags: [] },
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
        flowVersion: makeFlowVersion(),
        flowRunId: 'run-1',
        executionType: ExecutionType.RESUME,
        runEnvironment: RunEnvironment.TESTING,
        executionState: {
            steps: {
                trigger_1: {
                    type: FlowTriggerType.EMPTY as any,
                    status: StepOutputStatus.SUCCEEDED,
                    input: {},
                    output: {},
                },
            },
            tags: [],
        },
        workerHandlerId: null,
        httpRequestId: null,
        streamStepProgress: StreamStepProgress.NONE,
        stepNameToTest: null,
        resumePayload: { type: 'inline', value: {} },
        ...overrides,
    }
}

describe('flow operation invariants', () => {
    describe('BEGIN execution state assertion', () => {
        it('should throw EngineGenericError when BEGIN has non-empty execution state', async () => {
            const operation = makeBeginOperation({
                executionState: {
                    steps: {
                        trigger_1: {
                            type: FlowTriggerType.EMPTY as any,
                            status: StepOutputStatus.SUCCEEDED,
                            input: {},
                            output: {},
                        },
                    },
                    tags: [],
                },
            })

            await expect(flowOperation.execute(operation)).rejects.toThrow(EngineGenericError)
            await expect(flowOperation.execute(operation)).rejects.toThrow('BEGIN operation received with non-empty execution state')
        })

        it('should pass the assertion when BEGIN has empty execution state', async () => {
            const operation = makeBeginOperation({
                executionState: { steps: {}, tags: [] },
            })

            // The operation will fail further downstream (trigger setup),
            // but it should NOT throw InvalidBeginStateError
            try {
                await flowOperation.execute(operation)
            }
            catch (e) {
                expect((e as Error).name).not.toBe('InvalidBeginStateError')
            }
        })
    })

    describe('payload hydration', () => {
        it('forwards an inline BEGIN triggerPayload without hitting the engine file client', async () => {
            mockDownload.mockReset()
            const operation = makeBeginOperation({
                triggerPayload: { type: 'inline', value: { hello: 'world' } },
            })

            try {
                await flowOperation.execute(operation)
            }
            catch {
                // downstream execution may fail; we only assert the payload was not downloaded
            }

            expect(mockDownload).not.toHaveBeenCalled()
        })

        it('resolves a ref resumePayload via the engine file client', async () => {
            mockDownload.mockReset()
            mockDownload.mockResolvedValue(new TextEncoder().encode(JSON.stringify({ resumed: 'from-ref' })))

            const operation = makeResumeOperation({
                resumePayload: { type: 'ref', fileId: 'resume-file-1' },
            })

            try {
                await flowOperation.execute(operation)
            }
            catch {
                // downstream execution may fail; we only assert the resume payload was resolved
            }

            expect(mockDownload).toHaveBeenCalledWith({
                apiUrl: 'http://localhost:3000/',
                engineToken: 'test-token',
                fileId: 'resume-file-1',
            })
        })
    })
})
