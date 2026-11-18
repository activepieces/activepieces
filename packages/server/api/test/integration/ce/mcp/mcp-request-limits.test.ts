import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { MCP_MAX_TOOL_INPUT_ELEMENTS } from '../../../../src/app/mcp/mcp-server-builder'
import { MCP_REQUEST_BODY_LIMIT_BYTES } from '../../../../src/app/mcp/oauth/mcp-oauth.controller'
import { McpClient, mcpClientHelpers } from '../../../helpers/mcp-client'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
let ctx: TestContext
let mcpClient: McpClient

beforeAll(async () => {
    app = await setupTestEnvironment()
    ctx = await createTestContext(app)
    mcpClient = await mcpClientHelpers.connect({
        app,
        projectId: ctx.project.id,
        approve: (payload) => ctx.post('/v1/mcp-oauth/approve', payload),
    })
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('MCP tool input element limit', () => {
    it('rejects a tool call whose arguments are one element over the limit', async () => {
        const answer = await callListFlows({ args: { items: Array.from({ length: MCP_MAX_TOOL_INPUT_ELEMENTS }, () => 'x') } })

        expect(answer).toContain(`maximum of ${MCP_MAX_TOOL_INPUT_ELEMENTS} elements`)
    })

    it('accepts a tool call whose arguments are exactly at the limit', async () => {
        const answer = await callListFlows({ args: { items: Array.from({ length: MCP_MAX_TOOL_INPUT_ELEMENTS - 1 }, () => 'x') } })

        expect(answer).not.toContain('maximum of')
    })

    it('counts nested object members and array elements together', async () => {
        const nested = Array.from({ length: MCP_MAX_TOOL_INPUT_ELEMENTS / 2 }, () => ({ k: 'v' }))

        const answer = await callListFlows({ args: { items: nested } })

        expect(answer).toContain(`maximum of ${MCP_MAX_TOOL_INPUT_ELEMENTS} elements`)
    })

    it('still answers an ordinary tool call', async () => {
        const answer = await callListFlows({ args: {} })

        expect(answer).not.toContain('maximum of')
        expect(answer).not.toContain('Invalid arguments')
    })
})

describe('MCP request body limit', () => {
    it('rejects an unauthenticated body over the limit before reaching the handler', async () => {
        const res = await postRaw({ body: jsonRpcOfSize({ bytes: MCP_REQUEST_BODY_LIMIT_BYTES + 1 }), accessToken: null })

        expect(res.statusCode).toBe(413)
    })

    it.each(['text/plain', 'application/x-www-form-urlencoded'])('rejects an unauthenticated %s body over the limit', async (contentType) => {
        const res = await postRaw({ body: 'x'.repeat(MCP_REQUEST_BODY_LIMIT_BYTES + 1), accessToken: null, contentType })

        expect(res.statusCode).toBe(413)
    })

    it('rejects an authenticated body over the limit', async () => {
        const res = await postRaw({ body: jsonRpcOfSize({ bytes: MCP_REQUEST_BODY_LIMIT_BYTES + 1 }), accessToken: mcpClient.accessToken })

        expect(res.statusCode).toBe(413)
    })

    it('lets an unauthenticated body at the limit reach the bearer check', async () => {
        const res = await postRaw({ body: jsonRpcOfSize({ bytes: MCP_REQUEST_BODY_LIMIT_BYTES }), accessToken: null })

        expect(res.statusCode).toBe(401)
    })

    it('serves an authenticated tool call with a body at the limit', async () => {
        const res = await postRaw({ body: jsonRpcOfSize({ bytes: MCP_REQUEST_BODY_LIMIT_BYTES }), accessToken: mcpClient.accessToken })

        expect(res.statusCode).toBe(200)
        expect(res.body).toContain('"jsonrpc":"2.0"')
    })
})

function callListFlows({ args }: { args: Record<string, unknown> }): Promise<string> {
    return mcpClientHelpers.callTool({ app, mcpClient, name: LIST_FLOWS_TOOL, args })
}

function postRaw({ body, accessToken, contentType = 'application/json' }: { body: string, accessToken: string | null, contentType?: string }): ReturnType<FastifyInstance['inject']> {
    return app.inject({
        method: 'POST',
        url: mcpClient.endpoint,
        headers: {
            'content-type': contentType,
            'accept': 'application/json, text/event-stream',
            ...(accessToken === null ? {} : { authorization: `Bearer ${accessToken}` }),
        },
        payload: body,
    })
}

function jsonRpcOfSize({ bytes }: { bytes: number }): string {
    const envelope = (padding: string): string => JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: LIST_FLOWS_TOOL, arguments: { padding } },
    })
    const body = envelope('x'.repeat(bytes - Buffer.byteLength(envelope(''))))
    expect(Buffer.byteLength(body)).toBe(bytes)
    return body
}

const LIST_FLOWS_TOOL = 'ap_list_flows'
