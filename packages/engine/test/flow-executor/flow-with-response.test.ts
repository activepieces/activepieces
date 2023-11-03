import { ExecutionVerdict, FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { pieceExecutor } from '../../src/lib/handler/piece-executor'
import { EXECUTE_CONSTANTS, buildPieceAction } from './test-helper'

describe('flow with response', () => {

    it('should execute return response successfully', async () => {
        const response = {
            status: 200,
            headers: {
                'random': 'header',
            },
            body: {
                'hello': 'world',
            },
        }
        const result = await pieceExecutor.handle({
            action: buildPieceAction({
                name: 'http',
                pieceName: '@activepieces/piece-http',
                actionName: 'return_response',
                input: response,
            }), executionState: FlowExecutorContext.empty(), constants: EXECUTE_CONSTANTS,
        })
        expect(result.verdict).toBe(ExecutionVerdict.SUCCEEDED)
        expect(result.steps.http.output).toEqual(response)
    })

})