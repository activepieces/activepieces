import { ExecutionVerdict, FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { EXECUTE_CONSTANTS, buildCodeAction, buildSimpleLoopAction } from './test-helper'
import { flowExecutorNew } from '../../src/lib/handler/flow-executor'


describe('flow with looping', () => {

    it('should execute iterations', async () => {
        const codeAction = buildCodeAction({
            name: 'echo_step',
            input: {
                'index': '{{loop.index}}',
            },
        })
        const result = await flowExecutorNew.execute({
            action: buildSimpleLoopAction({
                name: 'loop',
                loopItems: '{{ [4,5,6] }}',
                firstLoopAction: codeAction,
            }),
            executionState: FlowExecutorContext.empty(),
            constants: EXECUTE_CONSTANTS,
        })

        expect(result.verdict).toBe(ExecutionVerdict.SUCCEEDED)
        expect(result.steps.loop.output.iterations.length).toBe(3)
        expect(result.steps.loop.output.index).toBe(3)
        expect(result.steps.loop.output.item).toBe(6)
    })

    it('should execute iterations and fail on first iteration', async () => {
        const generateArray = buildCodeAction({
            name: 'echo_step',
            input: {
                'array': '{{ [4,5,6] }}',
            },
            nextAction: buildSimpleLoopAction({
                name: 'loop',
                loopItems: '{{ echo_step.array }}',
                firstLoopAction: buildCodeAction({
                    name: 'runtime',
                    input: {},
                }),
            }),
        })
        const result = await flowExecutorNew.execute({
            action: generateArray,
            executionState: FlowExecutorContext.empty(),
            constants: EXECUTE_CONSTANTS,
        })

        expect(result.verdict).toBe(ExecutionVerdict.FAILED)
        expect(result.steps.loop.output.iterations.length).toBe(1)
        expect(result.steps.loop.output.index).toBe(1)
        expect(result.steps.loop.output.item).toBe(4)
    })

})