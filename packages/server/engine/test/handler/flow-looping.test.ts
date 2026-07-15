import { FlowAction, FlowRunStatus, LoopStepOutput } from '@activepieces/shared'
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

    it('should group items into batches when batchSize > 1', async () => {
        const result = await flowExecutor.execute({
            action: buildSimpleLoopAction({
                name: 'loop',
                loopItems: '{{ [1,2,3,4,5] }}',
                batchSize: 2,
                firstLoopAction: buildCodeAction({
                    name: 'echo_step',
                    input: { 'item': '{{loop.output.item}}' },
                }),
            }),
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({ stepNames: ['loop'] }),
        })

        const loopOut = result.steps.loop as LoopStepOutput
        expect(result.verdict.status).toBe(FlowRunStatus.RUNNING)
        // 5 items, batch of 2 -> 3 iterations, last batch is partial
        expect(loopOut.output?.iterations.length).toBe(3)
        expect(loopOut.output?.index).toBe(3)
        expect(loopOut.output?.item).toEqual([5])
    })

    it('should iterate item-by-item when batchSize is 1 (unchanged behavior)', async () => {
        const result = await flowExecutor.execute({
            action: buildSimpleLoopAction({ name: 'loop', loopItems: '{{ [1,2,3] }}', batchSize: 1 }),
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({ stepNames: ['loop'] }),
        })

        const loopOut = result.steps.loop as LoopStepOutput
        expect(loopOut.output?.iterations.length).toBe(3)
        expect(loopOut.output?.item).toBe(3)
    })

    it.each([0, -3, Number.NaN])('should fall back to item-by-item when batchSize is %s', async (batchSize) => {
        const result = await flowExecutor.execute({
            action: buildSimpleLoopAction({ name: 'loop', loopItems: '{{ [1,2,3] }}', batchSize }),
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({ stepNames: ['loop'] }),
        })

        const loopOut = result.steps.loop as LoopStepOutput
        expect(loopOut.output?.iterations.length).toBe(3)
        expect(loopOut.output?.item).toBe(3)
    })

    it('should truncate a fractional batchSize', async () => {
        const result = await flowExecutor.execute({
            action: buildSimpleLoopAction({ name: 'loop', loopItems: '{{ [1,2,3,4,5] }}', batchSize: 2.9 }),
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({ stepNames: ['loop'] }),
        })

        const loopOut = result.steps.loop as LoopStepOutput
        expect(loopOut.output?.iterations.length).toBe(3)
        expect(loopOut.output?.item).toEqual([5])
    })

    it('should produce a single batch when batchSize exceeds the item count', async () => {
        const result = await flowExecutor.execute({
            action: buildSimpleLoopAction({ name: 'loop', loopItems: '{{ [1,2,3] }}', batchSize: 100 }),
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({ stepNames: ['loop'] }),
        })

        const loopOut = result.steps.loop as LoopStepOutput
        expect(loopOut.output?.iterations.length).toBe(1)
        expect(loopOut.output?.index).toBe(1)
        expect(loopOut.output?.item).toEqual([1, 2, 3])
    })

    it('should run zero iterations for an empty list with a batchSize', async () => {
        const result = await flowExecutor.execute({
            action: buildSimpleLoopAction({ name: 'loop', loopItems: '{{ [] }}', batchSize: 10 }),
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({ stepNames: ['loop'] }),
        })

        const loopOut = result.steps.loop as LoopStepOutput
        expect(result.verdict.status).toBe(FlowRunStatus.RUNNING)
        expect(loopOut.output?.iterations.length).toBe(0)
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

})
