import { FlowRunStatus } from '@activepieces/shared'
import { vi } from 'vitest'
import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { flowExecutor } from '../../src/lib/handler/flow-executor'
import { workerSocket } from '../../src/lib/worker-socket'
import { buildPieceAction, generateMockEngineConstants } from './test-helper'

const { mockSendFlowResponse } = vi.hoisted(() => ({
    mockSendFlowResponse: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../src/lib/piece-context/waitpoint-client', () => ({
    waitpointClient: {
        create: vi.fn().mockResolvedValue({ id: 'mock-waitpoint-id', resumeUrl: 'http://localhost/resume' }),
    },
}))

vi.mock('../../src/lib/worker-socket', () => ({
    workerSocket: {
        getWorkerClient: vi.fn().mockReturnValue({
            sendFlowResponse: mockSendFlowResponse,
        }),
    },
}))

describe('flow waitpoint response propagation', () => {

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should send responseToSend via workerSocket when createWaitpoint is used with responseToSend', async () => {
        const responseBody = { hello: 'world' }
        const responseHeaders = { 'x-custom': 'header' }

        const action = buildPieceAction({
            name: 'http',
            pieceName: '@activepieces/piece-webhook',
            actionName: 'return_response_and_wait_for_next_webhook',
            input: {
                responseType: 'json',
                fields: {
                    status: 200,
                    headers: responseHeaders,
                    body: responseBody,
                },
            },
        })

        const result = await flowExecutor.execute({
            action,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({
                triggerPieceName: '@activepieces/piece-webhook',
                workerHandlerId: 'test-handler-id',
                httpRequestId: 'test-request-id',
            }),
        })

        expect(result.verdict).toEqual({
            status: FlowRunStatus.PAUSED,
        })

        expect(workerSocket.getWorkerClient).toHaveBeenCalled()
        expect(mockSendFlowResponse).toHaveBeenCalledWith({
            workerHandlerId: 'test-handler-id',
            httpRequestId: 'test-request-id',
            runResponse: {
                status: 200,
                body: responseBody,
                headers: expect.objectContaining(responseHeaders),
            },
        })
    })

    it('should not call sendFlowResponse when triggerPieceName does not match', async () => {
        const action = buildPieceAction({
            name: 'http',
            pieceName: '@activepieces/piece-webhook',
            actionName: 'return_response_and_wait_for_next_webhook',
            input: {
                responseType: 'json',
                fields: {
                    status: 200,
                    headers: {},
                    body: { test: true },
                },
            },
        })

        const result = await flowExecutor.execute({
            action,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({
                triggerPieceName: 'some-other-piece',
                workerHandlerId: 'test-handler-id',
                httpRequestId: 'test-request-id',
            }),
        })

        expect(result.verdict).toEqual({
            status: FlowRunStatus.PAUSED,
        })
        expect(mockSendFlowResponse).not.toHaveBeenCalled()
    })
})
