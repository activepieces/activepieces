import { flowExecutor } from '../../src/lib/handler/flow-executor'
import { ExecutionVerdict, FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { EXECUTE_CONSTANTS, buildPieceAction } from './test-helper'
import { ExecutionType, FlowRerunStrategy } from '@activepieces/shared'

describe('flow rerun', () => {
    const context = FlowExecutorContext.empty()
    it('should rerun entire flow', async () => {
        const failedResult = await flowExecutor.execute({
            action: buildPieceAction({
                name: 'send_http',
                pieceName: '@activepieces/piece-http',
                actionName: 'send_request',
                input: {
                    'url': 'https://cloud.activepieces.com/api/v1/asd',
                    'method': 'GET',
                    'headers': {},
                    'failsafe': false,
                    'queryParams': {},
                },
            }), executionState: context, constants: EXECUTE_CONSTANTS,
        })

        expect(failedResult.verdict).toBe(ExecutionVerdict.FAILED)

        const rerunEntireFlow = await flowExecutor.execute({
            action: buildPieceAction({
                name: 'send_http',
                pieceName: '@activepieces/piece-http',
                actionName: 'send_request',
                input: {
                    'url': 'https://cloud.activepieces.com/api/v1/pieces',
                    'method': 'GET',
                    'headers': {},
                    'failsafe': false,
                    'queryParams': {},
                },
            }), executionState: context, constants: {
                ...EXECUTE_CONSTANTS,
                rerunPayload: {
                    strategy: FlowRerunStrategy.FLOW,
                },
                executionType: ExecutionType.RERUN,
            },
        })
        expect(rerunEntireFlow.verdict).toBe(ExecutionVerdict.RUNNING)
    })

    it('should rerun flow from failed step', async () => {
        const failedResult = await flowExecutor.execute({
            action: buildPieceAction({
                name: 'send_http',
                pieceName: '@activepieces/piece-http',
                actionName: 'send_request',
                input: {
                    'url': 'https://cloud.activepieces.com/api/v1/asd',
                    'method': 'GET',
                    'headers': {},
                    'failsafe': false,
                    'queryParams': {},
                },
            }), executionState: context, constants: EXECUTE_CONSTANTS,
        })

        expect(failedResult.verdict).toBe(ExecutionVerdict.FAILED)

        const rerunFromFailed = await flowExecutor.execute({
            action: buildPieceAction({
                name: 'send_http',
                pieceName: '@activepieces/piece-http',
                actionName: 'send_request',
                input: {
                    'url': 'https://cloud.activepieces.com/api/v1/pieces',
                    'method': 'GET',
                    'headers': {},
                    'failsafe': false,
                    'queryParams': {},
                },
            }), executionState: context, constants: {
                ...EXECUTE_CONSTANTS,
                rerunPayload: {
                    strategy: FlowRerunStrategy.FROM_FAILED,
                },
                executionType: ExecutionType.RERUN,
            },
        })
        expect(rerunFromFailed.verdict).toBe(ExecutionVerdict.RUNNING)
    })
})