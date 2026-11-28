import { deno, tryParseFriendlyPieceError } from '@activepieces/core-utils'
import { BranchOperator, FlowAction, FlowRunStatus, LoopStepOutput, RouterExecutionType } from '@activepieces/shared'
import {  FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { flowExecutor } from '../../src/lib/handler/flow-executor'
import { buildCodeAction, buildPieceAction, buildRouterWithOneCondition, buildSimpleLoopAction, generateMockEngineConstants } from './test-helper'


describe('flow with looping', () => {

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('does not show a step skipped in this iteration the output it had in an earlier one', async () => {
        const readAfterRouter = buildPieceAction({
            name: 'data_mapper_1',
            pieceName: '@activepieces/piece-data-mapper',
            actionName: 'advanced_mapping',
            input: { mapping: { seen: '{{ data_mapper.output.total * 2 }}' } },
        })
        const routerOnOddItems: FlowAction = {
            ...buildRouterWithOneCondition({
                children: [buildPieceAction({
                    name: 'data_mapper',
                    pieceName: '@activepieces/piece-data-mapper',
                    actionName: 'advanced_mapping',
                    input: { mapping: { total: '{{ loop.output.item * 100 }}' } },
                })],
                conditions: [{ operator: BranchOperator.TEXT_EXACTLY_MATCHES, firstValue: '{{ loop.output.item % 2 }}', secondValue: '1', caseSensitive: false }],
                executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
            }),
            nextAction: readAfterRouter,
        }

        const result = await flowExecutor.execute({
            action: buildSimpleLoopAction({ name: 'loop', loopItems: '{{ [1,2,3,4] }}', firstLoopAction: routerOnOddItems }),
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({ stepNames: ['loop', 'router', 'data_mapper', 'data_mapper_1'] }),
        })

        const loopOut = result.steps.loop as LoopStepOutput
        const seen = loopOut.output?.iterations.map((iteration) => iteration.data_mapper_1.output)
        expect(seen).toEqual([{ seen: 200 }, { seen: '' }, { seen: 600 }, { seen: '' }])
    })

    it('evaluates expressions on the loop item per iteration through one script session', async () => {
        const createSession = vi.spyOn(deno, 'createSession')
        const result = await flowExecutor.execute({
            action: buildSimpleLoopAction({
                name: 'loop',
                loopItems: '{{ [4,5,6] }}',
                firstLoopAction: buildCodeAction({
                    name: 'echo_step',
                    input: {
                        item: '{{ loop.output.item * 10 }}',
                        index: '{{ loop.output.index + 0 }}',
                    },
                }),
            }),
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({ stepNames: ['loop', 'echo_step'] }),
        })

        const loopOut = result.steps.loop as LoopStepOutput
        const echoed = loopOut.output?.iterations.map((iteration) => iteration.echo_step.output)
        expect(echoed).toEqual([{ item: 40, index: 1 }, { item: 50, index: 2 }, { item: 60, index: 3 }])
        expect(createSession).toHaveBeenCalledTimes(1)
    })

    it('should execute iterations', async () => {
        const codeAction = buildCodeAction({
            name: 'echo_step',
            input: {
                'index': '{{loop.output.index}}',
            },
        })
        const result = await flowExecutor.execute({
            action: buildSimpleLoopAction({
                name: 'loop',
                loopItems: '{{ [4,5,6] }}',
                firstLoopAction: codeAction,
            }),
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({ stepNames: ['loop'] }),
        })

        const loopOut = result.steps.loop as LoopStepOutput
        expect(result.verdict.status).toBe(FlowRunStatus.RUNNING)
        expect(loopOut.output?.iterations.length).toBe(3)
        expect(loopOut.output?.index).toBe(3)
        expect(loopOut.output?.item).toBe(6)
    })

    it('should execute iterations and fail on first iteration', async () => {
        const generateArray = buildCodeAction({
            name: 'echo_step',
            input: {
                'array': '{{ [4,5,6] }}',
            },
            nextAction: buildSimpleLoopAction({
                name: 'loop',
                loopItems: '{{ echo_step.output.array }}',
                firstLoopAction: buildCodeAction({
                    name: 'runtime',
                    input: {},
                }),
            }),
        })
        const result = await flowExecutor.execute({
            action: generateArray,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({ stepNames: ['echo_step'] }),
        })

        const loopOut = result.steps.loop as LoopStepOutput
        expect(result.verdict.status).toBe(FlowRunStatus.FAILED)
        expect(loopOut.output?.iterations.length).toBe(1)
        expect(loopOut.output?.index).toBe(1)
        expect(loopOut.output?.item).toBe(4)
    })

    it('should fail the step when items are not a list', async () => {
        const result = await flowExecutor.execute({
            action: buildSimpleLoopAction({ name: 'loop', loopItems: '{{ 5 }}' }),
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })

        expect(result.verdict.status).toBe(FlowRunStatus.FAILED)
        expect(tryParseFriendlyPieceError(result.steps.loop.errorMessage)?.message).toBe('The items you have selected must be a list.')
    })

    it('should skip loop', async () => {
        const result = await flowExecutor.execute({
            action: buildSimpleLoopAction({ name: 'loop', loopItems: '{{ [4,5,6] }}', skip: true }), executionState: FlowExecutorContext.empty(), constants: generateMockEngineConstants(),
        })
        expect(result.verdict.status).toBe(FlowRunStatus.RUNNING)
        expect(result.steps.loop).toBeUndefined()
    })

    it('should skip loop in flow', async () => {
        const flow: FlowAction = {
            ...buildSimpleLoopAction({ name: 'loop', loopItems: '{{ [4,5,6] }}', skip: true }),
            nextAction: {
                ...buildCodeAction({
                    name: 'echo_step',
                    skip: false,
                    input: {
                        'key': '{{ 1 + 2 }}',
                    },
                }),
                nextAction: undefined,
            },
        }
        const result = await flowExecutor.execute({
            action: flow, executionState: FlowExecutorContext.empty(), constants: generateMockEngineConstants(),
        })
        expect(result.verdict.status).toBe(FlowRunStatus.RUNNING)
        expect(result.steps.loop).toBeUndefined()
        expect(result.steps.echo_step.output).toEqual({ 'key': 3 })
    })

    it('should keep every nested step output inside its iteration', async () => {
        const result = await flowExecutor.execute({
            action: buildSimpleLoopAction({
                name: 'loop',
                loopItems: '{{ [4,5,6] }}',
                firstLoopAction: buildCodeAction({
                    name: 'echo_step',
                    input: {
                        'index': '{{loop.output.index}}',
                    },
                }),
            }),
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({ stepNames: ['loop'] }),
        })

        const loopOut = result.steps.loop as LoopStepOutput
        expect(loopOut.output?.iterations.map((iteration) => iteration.echo_step?.output)).toEqual([
            { index: 1 },
            { index: 2 },
            { index: 3 },
        ])
    })

    it('should not build a circular graph when a nested step references the loop output', async () => {
        const result = await flowExecutor.execute({
            action: buildSimpleLoopAction({
                name: 'loop',
                loopItems: '{{ [4,5,6] }}',
                firstLoopAction: buildCodeAction({
                    name: 'echo_step',
                    input: {
                        'data': '{{loop.output}}',
                    },
                }),
            }),
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({ stepNames: ['loop'] }),
        })

        expect(() => JSON.stringify(result.steps)).not.toThrow()
    })

    it('should yield to the event loop between iterations', async () => {
        const iterationCount = 50
        let macrotaskTicks = 0
        let keepTicking = true
        const tick = (): void => {
            if (!keepTicking) {
                return
            }
            macrotaskTicks++
            setImmediate(tick)
        }
        setImmediate(tick)
        const ticksAtLoopUpserts: number[] = []
        const originalUpsertStep = FlowExecutorContext.prototype.upsertStep
        const upsertSpy = vi.spyOn(FlowExecutorContext.prototype, 'upsertStep').mockImplementation(function (this: FlowExecutorContext, stepName, stepOutput) {
            if (stepName === 'loop') {
                ticksAtLoopUpserts.push(macrotaskTicks)
            }
            return originalUpsertStep.call(this, stepName, stepOutput)
        })

        const result = await flowExecutor.execute({
            action: buildSimpleLoopAction({
                name: 'loop',
                loopItems: `{{ Array.from({ length: ${iterationCount} }, (_, i) => i) }}`,
            }),
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({ stepNames: ['loop'] }),
        }).finally(() => {
            keepTicking = false
            upsertSpy.mockRestore()
        })

        const loopOut = result.steps.loop as LoopStepOutput
        expect(loopOut.output?.iterations.length).toBe(iterationCount)
        expect(new Set(ticksAtLoopUpserts).size).toBeGreaterThanOrEqual(iterationCount)
    })

})
