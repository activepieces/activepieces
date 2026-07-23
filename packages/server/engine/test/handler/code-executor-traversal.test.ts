import { CodeAction, FlowRunStatus } from '@activepieces/shared'
import { codeExecutor } from '../../src/lib/handler/code-executor'
import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { buildCodeAction, generateMockEngineConstants } from './test-helper'

describe('code executor step-name path traversal', () => {
    it('fails a code step whose name traverses out of the code directory without executing it', async () => {
        const traversalName = '../../common/node_modules/bufferutil'
        const action: CodeAction = {
            ...buildCodeAction({ name: 'echo_step', input: {} }),
            name: traversalName,
        }

        const result = await codeExecutor.handle({
            action,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })

        expect(result.verdict.status).toBe(FlowRunStatus.FAILED)
        expect(result.steps[traversalName].status).toEqual('FAILED')
        expect(result.steps[traversalName].errorMessage).toContain('Invalid code step name')
    })
})
