import { ExecutionType, FlowRunStatus, FlowTriggerType, FlowVersionState, GenericStepOutput, StepOutputStatus } from '@activepieces/shared'
import { vi } from 'vitest'
import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { flowExecutor } from '../../src/lib/handler/flow-executor'
import { buildCodeAction, buildMockBeginExecuteFlowOperation, buildSimpleLoopAction, generateMockEngineConstants } from './test-helper'

vi.mock('../../src/lib/handler/run-progress', () => ({
    runProgressService: {
        sendUpdate: vi.fn().mockResolvedValue(undefined),
        backup: vi.fn().mockResolvedValue(undefined),
        init: vi.fn(),
        shutdown: vi.fn().mockResolvedValue(undefined),
    },
}))

vi.mock('../../src/lib/helper/trigger-helper', () => ({
    triggerHelper: {
        executeOnStart: vi.fn().mockResolvedValue(undefined),
    },
}))

describe('flow executor log size exceeded', () => {

    describe('with small log size limit', () => {
        let freshExecutor: typeof flowExecutor
        let FreshContext: typeof FlowExecutorContext

        beforeAll(async () => {
            process.env.AP_MAX_FLOW_RUN_LOG_SIZE_MB = '0.0001'
            vi.resetModules()
            const executorModule = await import('../../src/lib/handler/flow-executor')
            const contextModule = await import('../../src/lib/handler/context/flow-execution-context')
            freshExecutor = executorModule.flowExecutor
            FreshContext = contextModule.FlowExecutorContext
        })

        beforeEach(() => {
            vi.clearAllMocks()
        })

        it('should return LOG_SIZE_EXCEEDED verdict when log size exceeds limit', async () => {
            const action = buildCodeAction({
                name: 'echo_step',
                input: {
                    'key': 'x'.repeat(10000),
                },
            })

            const result = await freshExecutor.execute({
                action,
                executionState: FreshContext.empty(),
                constants: generateMockEngineConstants(),
            })

            expect(result.verdict.status).toBe(FlowRunStatus.LOG_SIZE_EXCEEDED)
        })

        it('should set failedStep to the step that caused log size to exceed', async () => {
            const action = buildCodeAction({
                name: 'echo_step',
                input: {
                    'key': 'x'.repeat(10000),
                },
            })

            const result = await freshExecutor.execute({
                action,
                executionState: FreshContext.empty(),
                constants: generateMockEngineConstants(),
            })

            expect(result.verdict.status).toBe(FlowRunStatus.LOG_SIZE_EXCEEDED)
            expect(result.verdict.failedStep).toEqual(expect.objectContaining({
                name: 'echo_step',
            }))
        })

        it('should return LOG_SIZE_EXCEEDED verdict when terminal loop action exceeds log size limit', async () => {
            const loopAction = buildSimpleLoopAction({
                name: 'loop',
                loopItems: '{{ [1, 2, 3] }}',
                firstLoopAction: buildCodeAction({
                    name: 'echo_step',
                    input: { key: 'x'.repeat(10000) },
                }),
            })

            const result = await freshExecutor.execute({
                action: loopAction,
                executionState: FreshContext.empty(),
                constants: generateMockEngineConstants(),
            })

            expect(result.verdict.status).toBe(FlowRunStatus.LOG_SIZE_EXCEEDED)
        })

        it('should return LOG_SIZE_EXCEEDED verdict when trigger output exceeds log size limit', async () => {
            const triggerName = 'trigger'
            const trigger = {
                name: triggerName,
                displayName: 'Test Trigger',
                type: FlowTriggerType.EMPTY as const,
                valid: true,
                settings: {},
                lastUpdatedDate: '2024-01-01T00:00:00Z',
                nextAction: buildCodeAction({
                    name: 'echo_step',
                    input: { key: 'value' },
                }),
            }

            const executionState = FreshContext.empty().upsertStep(triggerName, GenericStepOutput.create({
                type: FlowTriggerType.EMPTY,
                status: StepOutputStatus.SUCCEEDED,
                input: {},
            }).setOutput({ data: 'x'.repeat(10000) }))

            const result = await freshExecutor.executeFromTrigger({
                executionState,
                constants: generateMockEngineConstants(),
                input: buildMockBeginExecuteFlowOperation({
                    flowVersion: {
                        id: 'flowVersionId',
                        created: '2024-01-01T00:00:00Z',
                        updated: '2024-01-01T00:00:00Z',
                        flowId: 'flowId',
                        displayName: 'Test Flow',
                        trigger,
                        updatedBy: null,
                        valid: true,
                        schemaVersion: null,
                        agentIds: [],
                        state: FlowVersionState.DRAFT,
                        connectionIds: [],
                        backupFiles: null,
                        notes: [],
                    },
                }),
            })

            expect(result.verdict.status).toBe(FlowRunStatus.LOG_SIZE_EXCEEDED)
        })
    })

    it('should not throw when log size is within limit', async () => {
        const action = buildCodeAction({
            name: 'echo_step',
            input: {
                'key': 'small value',
            },
        })

        const result = await flowExecutor.execute({
            action,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })

        expect(result.verdict.status).toBe(FlowRunStatus.RUNNING)
        expect(result.steps.echo_step.status).toBe(StepOutputStatus.SUCCEEDED)
    })

    it('should not throw for loop actions when log size is within limit', async () => {
        const loopAction = buildSimpleLoopAction({
            name: 'loop',
            loopItems: '{{ [1, 2, 3] }}',
            firstLoopAction: buildCodeAction({
                name: 'echo_step',
                input: { key: 'value' },
            }),
        })

        const result = await flowExecutor.execute({
            action: loopAction,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })

        expect(result.verdict.status).toBe(FlowRunStatus.RUNNING)
    })
})
