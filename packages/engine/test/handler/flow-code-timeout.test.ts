import { FlowRunStatus, StepOutputStatus } from '@activepieces/shared'
import { EngineConstants } from '../../src/lib/handler/context/engine-constants'
import { codeExecutor } from '../../src/lib/handler/code-executor'
import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { buildCodeAction, generateMockEngineConstants } from './test-helper'

describe('code execution timeout', () => {

    const originalCodeTimeoutMs = EngineConstants.CODE_TIMEOUT_MS

    beforeEach(() => {
        // Set a short timeout for tests (1 second)
        Object.defineProperty(EngineConstants, 'CODE_TIMEOUT_MS', { value: 1000, writable: true })
    })

    afterEach(() => {
        Object.defineProperty(EngineConstants, 'CODE_TIMEOUT_MS', { value: originalCodeTimeoutMs, writable: true })
    })

    it('should timeout on async code that never resolves', async () => {
        const result = await codeExecutor.handle({
            action: buildCodeAction({
                name: 'timeout_async',
                input: {},
            }),
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })

        expect(result.verdict).toStrictEqual({
            status: FlowRunStatus.TIMEOUT,
        })
        expect(result.steps.timeout_async.status).toBe(StepOutputStatus.FAILED)
        expect(result.steps.timeout_async.errorMessage).toBe('Code execution timed out')
    }, 10000)

    it('should not timeout on fast code', async () => {
        const result = await codeExecutor.handle({
            action: buildCodeAction({
                name: 'echo_step',
                input: { key: 'value' },
            }),
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })

        expect(result.verdict.status).toBe(FlowRunStatus.RUNNING)
        expect(result.steps.echo_step.status).toBe(StepOutputStatus.SUCCEEDED)
        expect(result.steps.echo_step.output).toEqual({ key: 'value' })
    })

    it('should still report regular errors as FAILED, not TIMEOUT', async () => {
        const result = await codeExecutor.handle({
            action: buildCodeAction({
                name: 'runtime',
                input: {},
            }),
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })

        expect(result.verdict).toStrictEqual({
            status: FlowRunStatus.FAILED,
            failedStep: {
                name: 'runtime',
                displayName: 'Your Action Name',
                message: expect.stringContaining('Custom Runtime Error'),
            },
        })
        expect(result.steps.runtime.status).toBe(StepOutputStatus.FAILED)
        expect(result.steps.runtime.errorMessage).toContain('Custom Runtime Error')
    })
})
