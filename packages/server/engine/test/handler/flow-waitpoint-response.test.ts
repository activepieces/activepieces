import { FlowRunStatus } from '@activepieces/shared'
import { afterEach, beforeEach, vi } from 'vitest'
import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { flowExecutor } from '../../src/lib/handler/flow-executor'
import { buildPieceAction, generateMockEngineConstants } from './test-helper'

const { mockFetch } = vi.hoisted(() => ({
    mockFetch: vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) }),
}))

vi.mock('../../src/lib/piece-context/waitpoint-client', () => ({
    waitpointClient: {
        create: vi.fn().mockResolvedValue({ id: 'mock-waitpoint-id', resumeUrl: 'http://localhost/resume' }),
    },
}))

function getSendFlowResponseCall(): { url: string, body: unknown } | undefined {
    const call = mockFetch.mock.calls.find(([url]) => typeof url === 'string' && url.includes('/v1/engine/callbacks/send-flow-response'))
    if (!call) {
        return undefined
    }
    return { url: call[0], body: JSON.parse(call[1].body) }
}

describe('flow waitpoint response propagation', () => {

    beforeEach(() => {
        vi.stubGlobal('fetch', mockFetch)
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('POSTs responseToSend to the send-flow-response callback when createWaitpoint is used with responseToSend', async () => {
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

        const sendFlowResponseCall = getSendFlowResponseCall()
        expect(sendFlowResponseCall).toBeDefined()
        expect(sendFlowResponseCall!.body).toEqual({
            workerHandlerId: 'test-handler-id',
            httpRequestId: 'test-request-id',
            runResponse: {
                status: 200,
                body: responseBody,
                headers: expect.objectContaining(responseHeaders),
            },
        })
    })

    it('does not call send-flow-response when triggerPieceName does not match', async () => {
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
        expect(getSendFlowResponseCall()).toBeUndefined()
    })
})
