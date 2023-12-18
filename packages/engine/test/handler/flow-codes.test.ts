import { codeExecutor } from '../../src/lib/handler/code-executor'
import { ExecutionVerdict, FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { EXECUTE_CONSTANTS, buildCodeAction } from './test-helper'

describe('codeExecutor', () => {

    it('should execute code that echo paramters action successfully', async () => {
        const result = await codeExecutor.handle({
            action: buildCodeAction({
                name: 'echo_step',
                input: {
                    'key': '{{ 1 + 2 }}',
                },
            }), executionState: FlowExecutorContext.empty(), constants: EXECUTE_CONSTANTS,
        })
        expect(result.verdict).toBe(ExecutionVerdict.RUNNING)
        expect(result.steps.echo_step.output).toEqual({ 'key': 3 })
    })

    it('should execute code a code that throws an error', async () => {
        const result = await codeExecutor.handle({
            action: buildCodeAction({
                name: 'runtime',
                input: {},
            }), executionState: FlowExecutorContext.empty(), constants: EXECUTE_CONSTANTS,
        })
        expect(result.verdict).toBe(ExecutionVerdict.FAILED)
        expect(result.steps.runtime.status).toEqual('FAILED')
        expect(result.steps.runtime.errorMessage).toEqual('Custom Runtime Error')
    })

})