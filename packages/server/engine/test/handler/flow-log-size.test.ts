import { ExecutionType, FlowRunStatus, FlowTriggerType, StepOutputStatus, GenericStepOutput } from '@activepieces/shared'
import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { flowExecutor } from '../../src/lib/handler/flow-executor'
import { buildCodeAction, buildSimpleLoopAction, generateMockEngineConstants } from './test-helper'
import { vi } from 'vitest'

vi.mock('../../src/lib/services/progress.service', () => ({
    progressService: {
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
        let progressService: { sendUpdate: ReturnType<typeof vi.fn>, backup: ReturnType<typeof vi.fn> }

        beforeAll(async () => {
            process.env.AP_MAX_FLOW_RUN_LOG_SIZE_MB = '0.0001'
            vi.resetModules()
            const executorModule = await import('../../src/lib/handler/flow-executor')
            const contextModule = await import('../../src/lib/handler/context/flow-execution-context')
            const progressModule = await import('../../src/lib/services/progress.service')
            freshExecutor = executorModule.flowExecutor
            FreshContext = contextModule.FlowExecutorContext
            progressService = progressModule.progressService as any
        })

        beforeEach(() => {
            vi.clearAllMocks()
        })

        it('should throw LogSizeExceededError when log size exceeds limit', async () => {
            const action = buildCodeAction({
                name: 'echo_step',
                input: {
                    'key': 'x'.repeat(10000),
                },
            })

            await expect(freshExecutor.execute({
                action,
                executionState: FreshContext.empty(),
                constants: generateMockEngineConstants(),
            })).rejects.toThrow('Flow run data size exceeded the maximum allowed size')
        })

        it('should set verdict to LOG_SIZE_EXCEEDED before throwing', async () => {
            const action = buildCodeAction({
                name: 'echo_step',
                input: {
                    'key': 'x'.repeat(10000),
                },
            })

            try {
                await freshExecutor.execute({
                    action,
                    executionState: FreshContext.empty(),
                    constants: generateMockEngineConstants(),
                })
                expect.unreachable('should have thrown')
            }
            catch (e) {
                expect((e as Error).name).toBe('LogSizeExceededError')
            }

            expect(progressService.backup).toHaveBeenCalledWith(
                expect.objectContaining({
                    flowExecutorContext: expect.objectContaining({
                        verdict: expect.objectContaining({
                            status: FlowRunStatus.LOG_SIZE_EXCEEDED,
                        }),
                    }),
                }),
            )
        })

        it('should throw LogSizeExceededError when trigger output exceeds log size limit', async () => {
            const triggerName = 'trigger'
            const trigger = {
                name: triggerName,
                displayName: 'Test Trigger',
                type: FlowTriggerType.EMPTY,
                valid: true,
                settings: {},
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

            try {
                await freshExecutor.executeFromTrigger({
                    executionState,
                    constants: generateMockEngineConstants(),
                    input: {
                        executionType: ExecutionType.BEGIN,
                        triggerPayload: {},
                        executeTrigger: false,
                        flowVersion: { trigger } as any,
                    } as any,
                })
                expect.unreachable('should have thrown')
            }
            catch (e) {
                expect((e as Error).name).toBe('LogSizeExceededError')
            }

            expect(progressService.backup).toHaveBeenCalledWith(
                expect.objectContaining({
                    flowExecutorContext: expect.objectContaining({
                        verdict: expect.objectContaining({
                            status: FlowRunStatus.LOG_SIZE_EXCEEDED,
                        }),
                    }),
                }),
            )
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

    it('should skip log size check for loop actions', async () => {
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
