import { ErrorCode } from '@activepieces/core-utils'
import { EngineGenericError, PausedFlowTimeoutError, WaitpointRejectedError } from '@activepieces/shared'
import { throwForRejectedRequest } from '../../src/lib/piece-context/rejected-request'

describe('throwForRejectedRequest', () => {
    it('fails the step as a user error when the server refuses the request as invalid', async () => {
        const response = jsonResponse({
            status: 400,
            body: { code: ErrorCode.VALIDATION, params: { message: 'This step waits on 12 things, which exceeds the maximum of 10.' } },
        })

        const rejection = throwForRejectedRequest({ response, name: 'WaitpointCreationError', summary: 'Failed to create waitpoint' })

        await expect(rejection).rejects.toBeInstanceOf(WaitpointRejectedError)
        await expect(rejection).rejects.toThrow('exceeds the maximum of 10')
    })

    it('keeps an authentication failure an engine error', async () => {
        const response = jsonResponse({
            status: 401,
            body: { code: ErrorCode.AUTHENTICATION, params: { message: 'invalid bearer token' } },
        })

        const rejection = throwForRejectedRequest({ response, name: 'WaitpointCreationError', summary: 'Failed to create waitpoint' })

        await expect(rejection).rejects.toBeInstanceOf(EngineGenericError)
    })

    it('keeps a missing route an engine error', async () => {
        const response = new Response('Not Found', { status: 404, statusText: 'Not Found' })

        const rejection = throwForRejectedRequest({ response, name: 'WaitpointCreationError', summary: 'Failed to create waitpoint' })

        await expect(rejection).rejects.toBeInstanceOf(EngineGenericError)
        await expect(rejection).rejects.toThrow('Failed to create waitpoint: 404 Not Found')
    })

    it('reports a pause past the run deadline as a pause timeout', async () => {
        const response = jsonResponse({
            status: 400,
            body: { code: ErrorCode.PAUSED_FLOW_TIMEOUT_EXCEEDED, params: { pauseTimeoutDays: 30 } },
        })

        const rejection = throwForRejectedRequest({ response, name: 'WaitpointCreationError', summary: 'Failed to create waitpoint' })

        await expect(rejection).rejects.toBeInstanceOf(PausedFlowTimeoutError)
    })
})

function jsonResponse({ status, body }: { status: number, body: unknown }): Response {
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}
