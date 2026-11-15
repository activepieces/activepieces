import { createServer, Server } from 'node:http'
import { AddressInfo } from 'node:net'
import { FlowRunStatus, PieceAction } from '@activepieces/shared'
import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { flowExecutor } from '../../src/lib/handler/flow-executor'
import { buildPieceAction, generateMockEngineConstants } from './test-helper'

let server: Server
let baseUrl: string

function httpAction(path: string): PieceAction {
    return buildPieceAction({
        name: 'send_http',
        pieceName: '@activepieces/piece-http',
        actionName: 'send_request',
        input: {
            'url': `${baseUrl}${path}`,
            'method': 'GET',
            'headers': {},
            'body_type': 'none',
            'body': {},
            'queryParams': {},
        },
    })
}

beforeAll(async () => {
    server = createServer((req, res) => {
        const notFound = req.url === '/missing'
        res.writeHead(notFound ? 404 : 200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(notFound ? { message: 'Route not found' } : { ok: true }))
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close((err) => err ? reject(err) : resolve()))
})

describe('flow retry', () => {
    it('should retry entire flow', async () => {
        const context = FlowExecutorContext.empty()

        const failedResult = await flowExecutor.execute({
            action: httpAction('/missing'), executionState: context, constants: generateMockEngineConstants(),
        })
        const retryEntireFlow = await flowExecutor.execute({
            action: httpAction('/ok'), executionState: context, constants: generateMockEngineConstants(),
        })
        expect(failedResult.verdict.status).toBe(FlowRunStatus.FAILED)
        expect(retryEntireFlow.verdict.status).toBe(FlowRunStatus.RUNNING)
    })

    it('should retry flow from failed step', async () => {
        const context = FlowExecutorContext.empty()

        const failedResult = await flowExecutor.execute({
            action: httpAction('/missing'), executionState: context, constants: generateMockEngineConstants(),
        })

        const retryFromFailed = await flowExecutor.execute({
            action: httpAction('/ok'), executionState: context, constants: generateMockEngineConstants({}),
        })
        expect(failedResult.verdict.status).toBe(FlowRunStatus.FAILED)
        expect(retryFromFailed.verdict.status).toBe(FlowRunStatus.RUNNING)
    })
})
