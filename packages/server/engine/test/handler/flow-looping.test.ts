import { FlowRunStatus, LoopStepOutput } from '@activepieces/shared'
import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { flowExecutor } from '../../src/lib/handler/flow-executor'
import { buildCodeAction, buildFlowVersion, buildSimpleLoopAction, generateMockEngineConstants } from './test-helper'


describe('flow with looping', () => {

    it('should execute iterations', async () => {
        const codeAction = buildCodeAction({
            name: 'echo_step',
            input: {
                'index': '{{loop.index}}',
            },
        })
        const loopAction = buildSimpleLoopAction({
            name: 'loop',
            loopItems: '{{ [4,5,6] }}',
            children: ['echo_step'],
        })
        const fv = buildFlowVersion([loopAction, codeAction])
        const result = await flowExecutor.execute({
            stepNames: ['loop'],
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({ flowVersion: fv, stepNames: ['loop'] }),
        })

        const loopOut = result.steps.loop as LoopStepOutput
        expect(result.verdict.status).toBe(FlowRunStatus.RUNNING)
        expect(loopOut.output?.iterations.length).toBe(3)
        expect(loopOut.output?.index).toBe(3)
        expect(loopOut.output?.item).toBe(6)
    })

    it('should execute iterations and fail on first iteration', async () => {
        const echoStep = buildCodeAction({
            name: 'echo_step',
            input: {
                'array': '{{ [4,5,6] }}',
            },
        })
        const runtimeStep = buildCodeAction({
            name: 'runtime',
            input: {},
        })
        const loopAction = buildSimpleLoopAction({
            name: 'loop',
            loopItems: '{{ echo_step.array }}',
            children: ['runtime'],
        })
        const fv = buildFlowVersion([echoStep, loopAction, runtimeStep])
        const result = await flowExecutor.execute({
            stepNames: ['echo_step', 'loop'],
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({ flowVersion: fv, stepNames: ['echo_step'] }),
        })

        const loopOut = result.steps.loop as LoopStepOutput
        expect(result.verdict.status).toBe(FlowRunStatus.FAILED)
        expect(loopOut.output?.iterations.length).toBe(1)
        expect(loopOut.output?.index).toBe(1)
        expect(loopOut.output?.item).toBe(4)
    })

    it('should skip loop', async () => {
        const loopAction = buildSimpleLoopAction({ name: 'loop', loopItems: '{{ [4,5,6] }}', skip: true })
        const fv = buildFlowVersion([loopAction])
        const result = await flowExecutor.execute({
            stepNames: ['loop'],
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({ flowVersion: fv }),
        })
        expect(result.verdict.status).toBe(FlowRunStatus.RUNNING)
        expect(result.steps.loop).toBeUndefined()
    })

    it('should skip loop in flow', async () => {
        const loopAction = buildSimpleLoopAction({ name: 'loop', loopItems: '{{ [4,5,6] }}', skip: true })
        const echoStep = buildCodeAction({
            name: 'echo_step',
            skip: false,
            input: {
                'key': '{{ 1 + 2 }}',
            },
        })
        const fv = buildFlowVersion([loopAction, echoStep])
        const result = await flowExecutor.execute({
            stepNames: ['loop', 'echo_step'],
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({ flowVersion: fv }),
        })
        expect(result.verdict.status).toBe(FlowRunStatus.RUNNING)
        expect(result.steps.loop).toBeUndefined()
        expect(result.steps.echo_step.output).toEqual({ 'key': 3 })
    })

})
