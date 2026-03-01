import { FlowRunStatus } from '@activepieces/shared'
import { codeExecutor } from '../../src/lib/handler/code-executor'
import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { flowExecutor } from '../../src/lib/handler/flow-executor'
import { buildActionNode, buildCodeAction, buildFlowVersion, generateMockEngineConstants } from './test-helper'

describe('codeExecutor', () => {

    it('should execute code that echo parameters action successfully', async () => {
        const result = await codeExecutor.handle({
            node: buildActionNode(buildCodeAction({
                name: 'echo_step',
                input: {
                    'key': '{{ 1 + 2 }}',
                },
            })), executionState: FlowExecutorContext.empty(), constants: generateMockEngineConstants(),
        })
        expect(result.verdict.status).toBe(FlowRunStatus.RUNNING)
        expect(result.steps.echo_step.output).toEqual({ 'key': 3 })
    })

    it('should execute code a code that throws an error', async () => {
        const result = await codeExecutor.handle({
            node: buildActionNode(buildCodeAction({
                name: 'runtime',
                input: {},
            })), executionState: FlowExecutorContext.empty(), constants: generateMockEngineConstants(),
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
        const step = buildCodeAction({
            name: 'echo_step',
            input: {},
            skip: true,
        })
        const fv = buildFlowVersion([step])
        const result = await flowExecutor.execute({
            stepNames: ['echo_step'],
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({ flowVersion: fv }),
        })
        expect(result.verdict.status).toBe(FlowRunStatus.RUNNING)
        expect(result.steps.echo_step).toBeUndefined()
    })
    it('should skip flow action', async () => {
        const step1 = buildCodeAction({
            name: 'echo_step',
            skip: true,
            input: {},
        })
        const step2 = buildCodeAction({
            name: 'echo_step_1',
            input: {
                'key': '{{ 1 + 2 }}',
            },
        })
        const fv = buildFlowVersion([step1, step2])
        const result = await flowExecutor.execute({
            stepNames: ['echo_step', 'echo_step_1'],
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({ flowVersion: fv }),
        })
        expect(result.verdict.status).toBe(FlowRunStatus.RUNNING)
        expect(result.steps.echo_step).toBeUndefined()
        expect(result.steps.echo_step_1.output).toEqual({ 'key': 3 })
    })
})
