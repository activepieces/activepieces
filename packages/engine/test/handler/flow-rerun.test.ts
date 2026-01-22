import { FlowRunStatus } from '@activepieces/shared'
import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { flowExecutor } from '../../src/lib/handler/flow-executor'
import { buildPieceAction, generateMockEngineConstants } from './test-helper'

const failedHttpAction = buildPieceAction({
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
})

const successHttpAction =  buildPieceAction({
    name: 'send_http',
    pieceName: '@activepieces/piece-http',
    actionName: 'send_request',
    input: {
        'url': 'https://cloud.activepieces.com/api/v1/pieces',
        'method': 'GET',
        'headers': {},
        'body_type': 'none', 
        'body': {}, 
        'queryParams': {},
    },
})


describe('flow retry', () => {
    const context = FlowExecutorContext.empty()
    it('should retry entire flow', async () => {
        const failedResult = await flowExecutor.execute({
            action: failedHttpAction, executionState: context, constants: generateMockEngineConstants(),
        })
        const retryEntireFlow = await flowExecutor.execute({
            action: successHttpAction, executionState: context, constants: generateMockEngineConstants(),
        })
        expect(failedResult.verdict.status).toBe(FlowRunStatus.FAILED)
        expect(retryEntireFlow.verdict.status).toBe(FlowRunStatus.RUNNING)
    }, 10000)

    it('should retry flow from failed step', async () => {
        const failedResult = await flowExecutor.execute({
            action: failedHttpAction, executionState: context, constants: generateMockEngineConstants(),
        })

        const retryFromFailed = await flowExecutor.execute({
            action: successHttpAction, executionState: context, constants: generateMockEngineConstants({}),
        })
        expect(failedResult.verdict.status).toBe(FlowRunStatus.FAILED)
        expect(retryFromFailed.verdict.status).toBe(FlowRunStatus.RUNNING)
    }, 10000)
})
