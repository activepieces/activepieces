
import { BranchOperator, FlowRunStatus, RouterExecutionType, tryParseFriendlyPieceError } from '@activepieces/shared'
import { codeExecutor } from '../../src/lib/handler/code-executor'
import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { loopExecutor } from '../../src/lib/handler/loop-executor'
import { pieceExecutor } from '../../src/lib/handler/piece-executor'
import { routerExecuter } from '../../src/lib/handler/router-executor'
import { buildCodeAction, buildPieceAction, buildRouterWithOneCondition, buildSimpleLoopAction, generateMockEngineConstants } from './test-helper'

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
        expect(result.verdict).toStrictEqual({
            status: FlowRunStatus.RUNNING,
        })
        expect(result.steps.runtime.status).toEqual('FAILED')
        expect(result.steps.runtime.errorMessage).toContain('Custom Runtime Error')
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

        expect(result.verdict).toStrictEqual({
            status: FlowRunStatus.RUNNING,
        })
        expect(result.steps.send_http.status).toBe('FAILED')

        const error = tryParseFriendlyPieceError(result.steps.send_http.errorMessage)
        expect(error?.status).toBe(404)
        expect(error?.errorName).toBe('HttpError')
        expect(error?.message).toBe('Route not found')
        expect(error?.apiMessage).toBe('Route not found')
        expect(error?.responseBody).toEqual({
            statusCode: 404,
            error: 'Not Found',
            message: 'Route not found',
        })

    }, 10000)

})

describe('action input resolution failures surface as FAILED step', () => {

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('code-executor: missing connection in input fails the step instead of throwing INTERNAL_ERROR', async () => {
        vi.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 404 }))

        const result = await codeExecutor.handle({
            action: buildCodeAction({
                name: 'echo_step',
                input: {
                    storedIds: '{{connections[\'missing-conn\']}}',
                },
            }),
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })

        expect(result.verdict.status).toBe(FlowRunStatus.FAILED)
        expect(result.steps.echo_step.status).toBe('FAILED')
        expect(result.steps.echo_step.errorMessage).toContain('connection (missing-conn) not found')
    })

    it('loop-executor: missing connection in items fails the step instead of throwing INTERNAL_ERROR', async () => {
        vi.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 404 }))

        const result = await loopExecutor.handle({
            action: buildSimpleLoopAction({
                name: 'loop',
                loopItems: '{{connections[\'missing-conn\']}}',
            }),
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })

        expect(result.verdict.status).toBe(FlowRunStatus.FAILED)
        expect(result.steps.loop.status).toBe('FAILED')
        expect(result.steps.loop.errorMessage).toContain('connection (missing-conn) not found')
    })

    it('router-executor: missing connection in branch condition fails the step instead of throwing INTERNAL_ERROR', async () => {
        vi.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 404 }))

        const result = await routerExecuter.handle({
            action: buildRouterWithOneCondition({
                children: [null],
                conditions: [{
                    operator: BranchOperator.BOOLEAN_IS_TRUE,
                    firstValue: '{{connections[\'missing-conn\']}}',
                }],
                executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
            }),
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })

        expect(result.verdict.status).toBe(FlowRunStatus.FAILED)
        expect(result.steps.router.status).toBe('FAILED')
        expect(result.steps.router.errorMessage).toContain('connection (missing-conn) not found')
    })

})
