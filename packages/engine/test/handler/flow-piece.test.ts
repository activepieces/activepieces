import { ExecutionVerdict, FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { pieceExecutor } from '../../src/lib/handler/piece-executor'
import { buildPieceAction, generateMockEngineConstants } from './test-helper'

describe('pieceExecutor', () => {

    it('should execute data mapper successfully', async () => {
        const result = await pieceExecutor.handle({
            action: buildPieceAction({
                name: 'data_mapper',
                pieceName: '@activepieces/piece-data-mapper',
                actionName: 'advanced_mapping',
                input: {
                    mapping: {
                        'key': '{{ 1 + 2 }}',
                    },
                },
            }), executionState: FlowExecutorContext.empty(), constants: generateMockEngineConstants(),
        })
        expect(result.verdict).toBe(ExecutionVerdict.RUNNING)
        expect(result.steps.data_mapper.output).toEqual({ 'key': 3 })
    })

    it('should execute fail gracefully when pieces fail', async () => {
        const result = await pieceExecutor.handle({
            action: buildPieceAction({
                name: 'send_http',
                pieceName: '@activepieces/piece-http',
                actionName: 'send_request',
                input: {
                    'url': 'https://cloud.activepieces.com/api/v1/asd',
                    'method': 'GET',
                    'headers': {},
                    'body_type': 'none',
                    'body': {},
                    'queryParams': {},
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

        expect(result.verdict).toBe(ExecutionVerdict.FAILED)
        expect(result.steps.send_http.status).toBe('FAILED')
        expect(result.steps.send_http.errorMessage).toEqual(JSON.stringify(expectedError))
    })
})
