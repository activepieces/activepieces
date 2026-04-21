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
import type { BeginExecuteFlowOperation, FlowVersion } from '@activepieces/shared'

vi.mock('../../src/lib/handler/run-progress', () => ({
    runProgressService: {
        backup: vi.fn(),
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
        triggerPayload: {},
        executeTrigger: false,
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
})
