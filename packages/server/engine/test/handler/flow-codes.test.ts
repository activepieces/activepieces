import { FlowAction, FlowRunStatus } from '@activepieces/shared'
import { codeExecutor } from '../../src/lib/handler/code-executor'
import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
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
        expect(result.verdict.status).toBe(FlowRunStatus.RUNNING)
        expect(result.steps.echo_step.output).toEqual({ 'key': 3 })
    })

    it('should execute code a code that throws an error', async () => {
        const result = await codeExecutor.handle({
            action: buildCodeAction({
                name: 'runtime',
                input: {},
            }), executionState: FlowExecutorContext.empty(), constants: generateMockEngineConstants(),
        })
        expect(result.verdict).toStrictEqual({
            status: FlowRunStatus.FAILED,
            failedStep: {
                name: 'runtime',
                displayName: 'Your Action Name',
                message: expect.stringContaining('Custom Runtime Error'),
            },
        })
        expect(result.steps.runtime.status).toEqual('FAILED')
        expect(result.steps.runtime.errorMessage).toContain('Custom Runtime Error')
    })

    it('should skip code action', async () => {
        const result = await flowExecutor.execute({
            action: buildCodeAction({
                name: 'echo_step',
                input: {},
                skip: true,
            }), executionState: FlowExecutorContext.empty(), constants: generateMockEngineConstants(),
        })
        expect(result.verdict.status).toBe(FlowRunStatus.RUNNING)
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
        expect(result.verdict.status).toBe(FlowRunStatus.RUNNING)
        expect(result.steps.echo_step).toBeUndefined()
        expect(result.steps.echo_step_1.output).toEqual({ 'key': 3 })
    })
})
