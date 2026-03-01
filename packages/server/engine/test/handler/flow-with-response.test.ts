import { FlowRunStatus } from '@activepieces/shared'
import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { flowExecutor } from '../../src/lib/handler/flow-executor'
import { buildFlowVersion, buildPieceAction, generateMockEngineConstants } from './test-helper'

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
            respond: 'stop',
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

        const step = buildPieceAction({
            name: 'http',
            pieceName: '@activepieces/piece-webhook',
            actionName: 'return_response',
            input,
        })
        const fv = buildFlowVersion([step])
        const result = await flowExecutor.execute({
            stepNames: ['http'],
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({ flowVersion: fv }),
        })
        expect(result.verdict).toStrictEqual({
            status: FlowRunStatus.SUCCEEDED,
            stopResponse: response,
        })
        expect(result.steps.http.output).toEqual(response)
    })

})
