import { FlowAction } from '@activepieces/shared'
import { codeExecutor } from '../../src/lib/handler/code-executor'
import { ExecutionVerdict, FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { flowExecutor } from '../../src/lib/handler/flow-executor'
import { buildCodeAction, generateMockEngineConstants } from './test-helper'

describe('codeExecutor', () => {

    it('should execute code that echo parameters action successfully', async () => {
        const result = await codeExecutor.handle({
            action: buildCodeAction({
                name: 'echo_step',
                input: {
                    'key': '{{ 1 + 2 }}',
                },
            }), executionState: FlowExecutorContext.empty(), constants: generateMockEngineConstants(),
        })
        expect(result.verdict).toBe(ExecutionVerdict.RUNNING)
        expect(result.steps.echo_step.output).toEqual({ 'key': 3 })
    })

    it('should execute code a code that throws an error', async () => {
        const result = await codeExecutor.handle({
            action: buildCodeAction({
                name: 'runtime',
                input: {},
            }), executionState: FlowExecutorContext.empty(), constants: generateMockEngineConstants(),
        })
        expect(result.verdict).toBe(ExecutionVerdict.FAILED)
        expect(result.steps.runtime.status).toEqual('FAILED')
        expect(result.steps.runtime.errorMessage).toEqual('Custom Runtime Error')
    })

    it('should skip code action', async () => {
        const result = await flowExecutor.execute({
            action: buildCodeAction({
                name: 'echo_step',
                input: {},
                skip: true,
            }), executionState: FlowExecutorContext.empty(), constants: generateMockEngineConstants(),
        })
        expect(result.verdict).toBe(ExecutionVerdict.RUNNING)
        expect(result.steps.echo_step).toBeUndefined()
    })
    it('should skip flow action', async () => {
        const flow: FlowAction = {
            ...buildCodeAction({
                name: 'echo_step',
                skip: true,
                input: {},
            }),
            nextAction: {
                ...buildCodeAction({
                    name: 'echo_step_1',
                    input: {
                        'key': '{{ 1 + 2 }}',
                    },
                }),
            },
        }
        const result = await flowExecutor.execute({
            action: flow, executionState: FlowExecutorContext.empty(), constants: generateMockEngineConstants(),
        })
        expect(result.verdict).toBe(ExecutionVerdict.RUNNING)
        expect(result.steps.echo_step).toBeUndefined()
        expect(result.steps.echo_step_1.output).toEqual({ 'key': 3 })
    })
})
