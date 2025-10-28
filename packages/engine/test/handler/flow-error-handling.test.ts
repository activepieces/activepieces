
import { codeExecutor } from '../../src/lib/handler/code-executor'
import { ExecutionVerdict, FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { pieceExecutor } from '../../src/lib/handler/piece-executor'
import { buildCodeAction, buildPieceAction, generateMockEngineConstants } from './test-helper'

describe('code piece with error handling', () => {

    it('should continue on failure when execute code a code that throws an error', async () => {
        const result = await codeExecutor.handle({
            action: buildCodeAction({
                name: 'runtime',
                input: {},
                errorHandlingOptions: {
                    continueOnFailure: {
                        value: true,
                    },
                    retryOnFailure: {
                        value: false,
                    },
                },
            }), executionState: FlowExecutorContext.empty(), constants: generateMockEngineConstants(),
        })
        expect(result.verdict).toBe(ExecutionVerdict.RUNNING)
        expect(result.steps.runtime.status).toEqual('FAILED')
        expect(result.steps.runtime.errorMessage).toEqual('Custom Runtime Error')
    })

})

describe('piece with error handling', () => {

    it('should continue on failure when piece fails', async () => {
        const result = await pieceExecutor.handle({
            action: buildPieceAction({
                name: 'send_http',
                pieceName: '@activepieces/piece-http',
                actionName: 'send_request',
                input: {
                    'method': 'POST',
                    'url': 'https://cloud.activepieces.com/api/v1/flags',
                    'headers': {},
                    'queryParams': {},
                    'body_type': 'none',
                    'body': {},
                },
                errorHandlingOptions: {
                    continueOnFailure: {
                        value: true,
                    },
                    retryOnFailure: {
                        value: false,
                    },
                },
            }), executionState: FlowExecutorContext.empty(), constants: generateMockEngineConstants(),
        })

        const expectedError = {
            response: {
                status: 404,
                body: {
                    statusCode: 404,
                    error: 'Not Found',
                    message: 'Route not found',
                },
            },
            request: {},
        }

        expect(result.verdict).toBe(ExecutionVerdict.RUNNING)
        expect(result.steps.send_http.status).toBe('FAILED')
        expect(result.steps.send_http.errorMessage).toEqual(JSON.stringify(expectedError))

    }, 10000)

})
