import { FlowAction, FlowActionType, FlowRunStatus, GenericStepOutput, LoopStepOutput, StepOutputStatus } from '@activepieces/shared'
import {  FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { flowExecutor } from '../../src/lib/handler/flow-executor'
import { buildCodeAction, buildSimpleLoopAction, generateMockEngineConstants } from './test-helper'


describe('flow with looping', () => {

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

})

describe('flow with looping — sensitive items', () => {

    async function runLoopOver(sensitiveOutputPaths: string[] | undefined): Promise<LoopStepOutput> {
        const executionState = await FlowExecutorContext.empty().upsertStep('list_keys', GenericStepOutput.create({
            type: FlowActionType.PIECE,
            status: StepOutputStatus.SUCCEEDED,
            input: {},
            output: { keys: [{ token: 'sk-real-1' }, { token: 'sk-real-2' }] },
            sensitiveOutputPaths,
        }))
        const result = await flowExecutor.execute({
            action: buildSimpleLoopAction({ name: 'loop', loopItems: '{{ list_keys.output.keys }}' }),
            executionState,
            constants: generateMockEngineConstants({ stepNames: ['loop', 'list_keys'] }),
        })
        return result.steps.loop as LoopStepOutput
    }

    it('marks item sensitive when the whole items array is redacted upstream', async () => {
        const loopOut = await runLoopOver(['keys'])

        expect(loopOut.sensitiveOutputPaths).toEqual(['item'])
    })

    it('marks item sensitive when individual array elements are redacted upstream', async () => {
        const loopOut = await runLoopOver(['keys.0.token', 'keys.1.token'])

        expect(loopOut.sensitiveOutputPaths).toEqual(['item'])
    })

    it('leaves item unmarked when nothing upstream is sensitive', async () => {
        const loopOut = await runLoopOver(undefined)

        expect(loopOut.sensitiveOutputPaths).toBeUndefined()
    })

    it('keeps the raw item in execution state so inner steps still receive it', async () => {
        const loopOut = await runLoopOver(['keys'])

        expect(loopOut.output?.item).toEqual({ token: 'sk-real-2' })
    })
})
