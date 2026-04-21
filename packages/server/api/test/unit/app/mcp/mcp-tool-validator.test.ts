import { AgentToolType, McpAuthType, McpProtocol } from '@activepieces/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../../src/app/helper/ap-axios', () => ({
    apAxios: { post: vi.fn() },
}))

import { apAxios } from '../../../../src/app/helper/ap-axios'
import { mcpToolValidator } from '../../../../src/app/mcp/mcp-tool-validator'

type AxiosCall = { url: string, body: string, config: AxiosConfigLike }
type AxiosConfigLike = { headers?: Record<string, string>, maxRedirects?: number, timeout?: number }

const JSON_HEADERS = { 'content-type': 'application/json' }
const SSE_HEADERS = { 'content-type': 'text/event-stream' }

describe('mcpToolValidator.validateAgentMcpTool', () => {
    beforeEach(() => {
        vi.mocked(apAxios.post).mockReset()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('returns tool names from a tools/list JSON response', async () => {
        mockJsonRpcServer({ tools: [{ name: 'a' }, { name: 'b' }] })

        const result = await mcpToolValidator.validateAgentMcpTool(buildTool())

        expect(result.error).toBeUndefined()
        expect(result.toolNames).toEqual(['a', 'b'])
    })

    it('parses an SSE tools/list response', async () => {
        mockJsonRpcServer({ tools: [{ name: 'streamed' }] }, { forceSse: true })

        const result = await mcpToolValidator.validateAgentMcpTool(
            buildTool({ protocol: McpProtocol.STREAMABLE_HTTP }),
        )

        expect(result.error).toBeUndefined()
        expect(result.toolNames).toEqual(['streamed'])
    })

    it('sends initialize → notifications/initialized → tools/list in order', async () => {
        mockJsonRpcServer({ tools: [] })

        await mcpToolValidator.validateAgentMcpTool(buildTool())

        const methods = capturedCalls().map((c) => c.body.method)
        expect(methods).toEqual([
            'initialize',
            'notifications/initialized',
            'tools/list',
        ])
    })

    it('disables redirects and sets a 64KB response cap', async () => {
        mockJsonRpcServer({ tools: [] })

        await mcpToolValidator.validateAgentMcpTool(buildTool())

        const call = capturedCalls()[0]
        expect(call.config.maxRedirects).toBe(0)
        expect(call.config.maxContentLength).toBe(64 * 1024)
        expect(call.config.maxBodyLength).toBe(64 * 1024)
        expect(call.config.timeout).toBe(15_000)
    })

    it('collapses any downstream failure to a single generic error', async () => {
        vi.mocked(apAxios.post).mockRejectedValue(
            Object.assign(new Error('ENOTFOUND attacker.example'), { code: 'ENOTFOUND' }),
        )

        const result = await mcpToolValidator.validateAgentMcpTool(buildTool())

        expect(result.toolNames).toBeUndefined()
        expect(result.error).toBe(GENERIC_ERROR)
        expect(result.error).not.toMatch(/ENOTFOUND/i)
    })

    it('rejects malformed URLs without dialing', async () => {
        const spy = vi.mocked(apAxios.post)

        const result = await mcpToolValidator.validateAgentMcpTool(
            buildTool({ serverUrl: 'not a url' }),
        )

        expect(result.toolNames).toBeUndefined()
        expect(result.error).toBe(GENERIC_ERROR)
        expect(spy).not.toHaveBeenCalled()
    })

    it('rejects non-http(s) URLs without dialing', async () => {
        const spy = vi.mocked(apAxios.post)

        const result = await mcpToolValidator.validateAgentMcpTool(
            buildTool({ serverUrl: 'file:///etc/passwd' }),
        )

        expect(result.toolNames).toBeUndefined()
        expect(result.error).toBe(GENERIC_ERROR)
        expect(spy).not.toHaveBeenCalled()
    })

    describe('auth header mapping', () => {
        it('forwards API key header', async () => {
            mockJsonRpcServer({ tools: [] })

            await mcpToolValidator.validateAgentMcpTool(
                buildTool({
                    auth: {
                        type: McpAuthType.API_KEY,
                        apiKey: 'secret-123',
                        apiKeyHeader: 'X-API-Key',
                    },
                }),
            )

            const call = capturedCalls()[0]
            expect(call.config.headers?.['X-API-Key']).toBe('secret-123')
        })

        it('forwards Bearer access token', async () => {
            mockJsonRpcServer({ tools: [] })

            await mcpToolValidator.validateAgentMcpTool(
                buildTool({
                    auth: { type: McpAuthType.ACCESS_TOKEN, accessToken: 'tok-abc' },
                }),
            )

            const call = capturedCalls()[0]
            expect(call.config.headers?.['Authorization']).toBe('Bearer tok-abc')
        })
    })
})

const GENERIC_ERROR = 'Could not validate MCP server. Check the URL, authentication, and that the server is reachable.'

function defaultTool(): DefaultTool {
    return {
        type: AgentToolType.MCP,
        toolName: 'unit-test',
        serverUrl: 'https://mcp.example.com/rpc',
        protocol: McpProtocol.SIMPLE_HTTP,
        auth: { type: McpAuthType.NONE },
    }
}

type DefaultTool = {
    type: AgentToolType.MCP
    toolName: string
    serverUrl: string
    protocol: McpProtocol
    auth: { type: McpAuthType.NONE } | { type: McpAuthType.API_KEY, apiKey: string, apiKeyHeader: string } | { type: McpAuthType.ACCESS_TOKEN, accessToken: string } | { type: McpAuthType.HEADERS, headers: Record<string, string> }
}

function buildTool(overrides: Partial<DefaultTool> = {}): DefaultTool {
    return { ...defaultTool(), ...overrides }
}

function capturedCalls(): AxiosCall[] {
    return vi.mocked(apAxios.post).mock.calls.map(([url, body, config]) => ({
        url: String(url),
        body: typeof body === 'string' ? JSON.parse(body) : body,
        config: (config ?? {}) as AxiosConfigLike & { maxRedirects?: number, maxContentLength?: number, maxBodyLength?: number, timeout?: number },
    }))
}

function mockJsonRpcServer(
    { tools }: { tools: Array<{ name: string }> },
    { forceSse = false }: { forceSse?: boolean } = {},
): void {
    vi.mocked(apAxios.post).mockImplementation(async (...args: unknown[]) => {
        const rawBody = args[1]
        const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : {}
        if (body.method === 'initialize') {
            const payload = {
                jsonrpc: '2.0',
                id: body.id,
                result: {
                    protocolVersion: '2025-03-26',
                    serverInfo: { name: 'mock', version: '0' },
                    capabilities: { tools: {} },
                },
            }
            return makeResponse(payload, forceSse)
        }
        if (body.method === 'tools/list') {
            const payload = { jsonrpc: '2.0', id: body.id, result: { tools } }
            return makeResponse(payload, forceSse)
        }
        return makeResponse({}, false)
    })
}

function makeResponse(payload: unknown, sse: boolean): { data: string, headers: Record<string, string> } {
    if (sse) {
        return {
            data: `event: message\ndata: ${JSON.stringify(payload)}\n\n`,
            headers: SSE_HEADERS,
        }
    }
    return { data: JSON.stringify(payload), headers: JSON_HEADERS }
}
