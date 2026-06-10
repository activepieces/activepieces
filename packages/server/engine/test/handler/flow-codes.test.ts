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

    it('should execute code that throws a system error and mark as FAILED', async () => {
        const result = await codeExecutor.handle({
            action: buildCodeAction({
                name: 'system_error',
                input: {},
            }),
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })
        expect(result.verdict).toStrictEqual({
            status: FlowRunStatus.FAILED,
            failedStep: {
                name: 'system_error',
                displayName: 'Your Action Name',
                message: expect.stringContaining('uv_os_homedir'),
            },
        })
        expect(result.steps.system_error.status).toEqual('FAILED')
        expect(result.steps.system_error.errorMessage).toContain('uv_os_homedir')
    })

    it('should mark step as FAILED when code calls process.exit()', async () => {
        const result = await codeExecutor.handle({
            action: buildCodeAction({ name: 'process_exit', input: {} }),
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })
        expect(result.verdict.status).toBe(FlowRunStatus.FAILED)
        expect(result.steps.process_exit.status).toEqual('FAILED')
        expect(result.steps.process_exit.errorMessage).toContain('1')
    })

    it('should mark step as FAILED on unhandled promise rejection and include error in message', async () => {
        const result = await codeExecutor.handle({
            action: buildCodeAction({ name: 'unhandled_rejection', input: {} }),
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })
        expect(result.verdict.status).toBe(FlowRunStatus.FAILED)
        expect(result.steps.unhandled_rejection.status).toEqual('FAILED')
        expect(result.verdict.failedStep?.message).toContain('Unhandled rejection from user code')
    })

    it('should mark step as FAILED when code throws inside setTimeout', async () => {
        const result = await codeExecutor.handle({
            action: buildCodeAction({ name: 'setTimeout_error', input: {} }),
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })
        expect(result.verdict.status).toBe(FlowRunStatus.FAILED)
        expect(result.steps.setTimeout_error.status).toEqual('FAILED')
        expect(result.verdict.failedStep?.message).toContain('Unexpected token')
    })

    it('should execute code that requires an npm package successfully', async () => {
        const result = await codeExecutor.handle({
            action: buildCodeAction({ name: 'hello_world_npm', input: { name: 'World' } }),
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })
        expect(result.verdict.status).toBe(FlowRunStatus.RUNNING)
        expect(result.steps.hello_world_npm.output).toEqual({ message: 'Hello, World!' })
    })

    it('should include stdout and stderr in errorMessage when code fails', async () => {
        const result = await codeExecutor.handle({
            action: buildCodeAction({ name: 'stdout_on_failure', input: {} }),
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })
        expect(result.verdict.status).toBe(FlowRunStatus.FAILED)
        expect(result.steps.stdout_on_failure.errorMessage).toContain('Error after logging')
        expect(result.steps.stdout_on_failure.errorMessage).toContain('stdout line from user code')
        expect(result.steps.stdout_on_failure.errorMessage).toContain('stderr line from user code')
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
