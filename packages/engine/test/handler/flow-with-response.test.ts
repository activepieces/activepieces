import { FlowRunStatus } from '@activepieces/shared'
import { ExecutionVerdict, FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { flowExecutor } from '../../src/lib/handler/flow-executor'
import { buildPieceAction, generateMockEngineConstants } from './test-helper'

describe('flow with response', () => {

    it('should execute return response successfully', async () => {
        const input = {
            responseType: 'json',
            fields: {
                status: 200,
                headers: {
                    'random': 'header',
                },
                body: {
                    'hello': 'world',
                },
            },
        }
        const response = {
            status: 200,
            headers: {
                'random': 'header',
            },
            body: {
                'hello': 'world',
            },
        }

        const result = await flowExecutor.execute({
            action: buildPieceAction({
                name: 'http',
                pieceName: '@activepieces/piece-webhook',
                actionName: 'return_response',
                input,
            }), executionState: FlowExecutorContext.empty(), constants: generateMockEngineConstants(),
        })
   
        expect(result.verdict).toBe(ExecutionVerdict.SUCCEEDED)
        expect(result.verdictResponse).toEqual({
            reason: FlowRunStatus.STOPPED,
            stopResponse: response,
        })
        expect(result.steps.http.output).toEqual(response)
    })

})
