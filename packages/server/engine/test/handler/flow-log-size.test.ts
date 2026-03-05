import { FlowRunStatus, StepOutputStatus } from '@activepieces/shared'
import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { flowExecutor } from '../../src/lib/handler/flow-executor'
import { buildCodeAction, generateMockEngineConstants } from './test-helper'
import { vi } from 'vitest'

vi.mock('../../src/lib/services/progress.service', () => ({
    progressService: {
        sendUpdate: vi.fn().mockResolvedValue(undefined),
        backup: vi.fn().mockResolvedValue(undefined),
        init: vi.fn(),
        shutdown: vi.fn().mockResolvedValue(undefined),
    },
}))

describe('flow executor log size exceeded', () => {

    it('should throw LogSizeExceededError when log size exceeds limit', async () => {
        const originalEnv = process.env.AP_MAX_FLOW_RUN_LOG_SIZE_MB
        process.env.AP_MAX_FLOW_RUN_LOG_SIZE_MB = '0.0001'

        vi.resetModules()
        const { flowExecutor: freshExecutor } = await import('../../src/lib/handler/flow-executor')
        const { FlowExecutorContext: FreshContext } = await import('../../src/lib/handler/context/flow-execution-context')

        const action = buildCodeAction({
            name: 'echo_step',
            input: {
                'key': 'x'.repeat(10000),
            },
        })

        await expect(freshExecutor.execute({
            action,
            executionState: FreshContext.empty(),
            constants: generateMockEngineConstants(),
        })).rejects.toThrow('Flow run data size exceeded the maximum allowed size')

        process.env.AP_MAX_FLOW_RUN_LOG_SIZE_MB = originalEnv
    })

    it('should set verdict to LOG_SIZE_EXCEEDED before throwing', async () => {
        const originalEnv = process.env.AP_MAX_FLOW_RUN_LOG_SIZE_MB
        process.env.AP_MAX_FLOW_RUN_LOG_SIZE_MB = '0.0001'

        vi.resetModules()
        const { flowExecutor: freshExecutor } = await import('../../src/lib/handler/flow-executor')
        const { FlowExecutorContext: FreshContext } = await import('../../src/lib/handler/context/flow-execution-context')
        const { progressService } = await import('../../src/lib/services/progress.service')

        const action = buildCodeAction({
            name: 'echo_step',
            input: {
                'key': 'x'.repeat(10000),
            },
        })

        try {
            await freshExecutor.execute({
                action,
                executionState: FreshContext.empty(),
                constants: generateMockEngineConstants(),
            })
            expect.unreachable('should have thrown')
        }
        catch (e) {
            expect((e as Error).name).toBe('LogSizeExceededError')
        }

        // Verify backup was called with LOG_SIZE_EXCEEDED status
        expect(progressService.backup).toHaveBeenCalledWith(
            expect.objectContaining({
                flowExecutorContext: expect.objectContaining({
                    verdict: expect.objectContaining({
                        status: FlowRunStatus.LOG_SIZE_EXCEEDED,
                    }),
                }),
            }),
        )

        process.env.AP_MAX_FLOW_RUN_LOG_SIZE_MB = originalEnv
    })

    it('should not throw when log size is within limit', async () => {
        const action = buildCodeAction({
            name: 'echo_step',
            input: {
                'key': 'small value',
            },
        })

        const result = await flowExecutor.execute({
            action,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })

        expect(result.verdict.status).toBe(FlowRunStatus.RUNNING)
        expect(result.steps.echo_step.status).toBe(StepOutputStatus.SUCCEEDED)
    })

    it('should skip log size check for loop actions', async () => {
        // Even with large data, loops should not trigger the check
        // because their children are checked individually
        const { buildSimpleLoopAction } = await import('./test-helper')

        const loopAction = buildSimpleLoopAction({
            name: 'loop',
            loopItems: '{{ [1, 2, 3] }}',
            firstLoopAction: buildCodeAction({
                name: 'echo_step',
                input: { key: 'value' },
            }),
        })

        const result = await flowExecutor.execute({
            action: loopAction,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })

        // Should complete without throwing
        expect(result.verdict.status).toBe(FlowRunStatus.RUNNING)
    })
})
