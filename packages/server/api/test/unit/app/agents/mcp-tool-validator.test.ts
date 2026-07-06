import { safeHttp } from '@activepieces/server-utils'
import { AgentToolType, McpAuthType, McpProtocol } from '@activepieces/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@activepieces/server-utils', () => ({
    safeHttp: { axios: { request: vi.fn() } },
}))

import { mcpToolValidator } from '../../../../src/app/agents/mcp-tool-validator'

type AxiosCall = { url: string, body: Record<string, unknown>, config: AxiosConfigLike }
type AxiosConfigLike = { headers?: Record<string, string>, maxRedirects?: number, timeout?: number, maxContentLength?: number, maxBodyLength?: number }

const JSON_HEADERS = { 'content-type': 'application/json' }
const SSE_HEADERS = { 'content-type': 'text/event-stream' }

describe('mcpToolValidator.validateAgentMcpTool', () => {
    beforeEach(() => {
        vi.mocked(safeHttp.axios.request).mockReset()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('returns tool names from a streamable tools/list response', async () => {
        mockJsonRpcServer({ tools: [tool('a'), tool('b')] }, { forceSse: true })

        const result = await mcpToolValidator.validateAgentMcpTool(
            buildTool({ protocol: McpProtocol.STREAMABLE_HTTP }),
        )

        expect(result.error).toBeUndefined()
        expect(result.toolNames).toEqual(['a', 'b'])
    })

    it('parses an SSE tools/list response', async () => {
        mockJsonRpcServer({ tools: [tool('streamed')] }, { forceSse: true })

        const result = await mcpToolValidator.validateAgentMcpTool(
            buildTool({ protocol: McpProtocol.STREAMABLE_HTTP }),
        )

        expect(result.error).toBeUndefined()
        expect(result.toolNames).toEqual(['streamed'])
    })

    it('sends initialize → notifications/initialized → tools/list in order', async () => {
        mockJsonRpcServer({ tools: [] })

        await mcpToolValidator.validateAgentMcpTool(
            buildTool({ protocol: McpProtocol.STREAMABLE_HTTP }),
        )

        const methods = capturedCalls().map((c) => c.body.method)
        expect(methods).toEqual([
            'initialize',
            'notifications/initialized',
            'tools/list',
        ])
    })

    it('preserves HeadersInit values from the streamable transport request', async () => {
        mockJsonRpcServer({ tools: [] })

        await mcpToolValidator.validateAgentMcpTool(
            buildTool({ protocol: McpProtocol.STREAMABLE_HTTP }),
        )

        const initializeCall = capturedCalls()[0]
        expect(initializeCall.config.headers?.['accept']).toBe('application/json, text/event-stream')
        expect(initializeCall.config.headers?.['content-type']).toBe('application/json')
    })

    it('sets a 64KB response cap and timeout on streamable validation requests', async () => {
        mockJsonRpcServer({ tools: [] })

        await mcpToolValidator.validateAgentMcpTool(
            buildTool({ protocol: McpProtocol.STREAMABLE_HTTP }),
        )

        const call = capturedCalls()[0]
        expect(call.config.maxContentLength).toBe(64 * 1024)
        expect(call.config.maxBodyLength).toBe(64 * 1024)
        expect(call.config.timeout).toBe(15_000)
    })

    it('collapses any downstream failure to a single generic error', async () => {
        vi.mocked(safeHttp.axios.request).mockRejectedValue(
            Object.assign(new Error('ENOTFOUND attacker.example'), { code: 'ENOTFOUND' }),
        )

        const result = await mcpToolValidator.validateAgentMcpTool(buildTool())

        expect(result.toolNames).toBeUndefined()
        expect(result.error).toBe(GENERIC_ERROR)
        expect(result.error).not.toMatch(/ENOTFOUND/i)
    })

    it('rejects malformed URLs without dialing', async () => {
        const spy = vi.mocked(safeHttp.axios.request)

        const result = await mcpToolValidator.validateAgentMcpTool(
            buildTool({ serverUrl: 'not a url' }),
        )

        expect(result.toolNames).toBeUndefined()
        expect(result.error).toBe(GENERIC_ERROR)
        expect(spy).not.toHaveBeenCalled()
    })

    it('rejects non-http(s) URLs without dialing', async () => {
        const spy = vi.mocked(safeHttp.axios.request)

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
    return vi.mocked(safeHttp.axios.request).mock.calls.map(([config]) => {
        const requestConfig = config as { url: string, data?: string } & AxiosConfigLike
        return {
            url: String(requestConfig.url),
            body: requestConfig.data ? JSON.parse(requestConfig.data) : {},
            config: requestConfig,
        }
    })
}

function mockJsonRpcServer(
    { tools }: { tools: Array<{ name: string, inputSchema: Record<string, unknown> }> },
    { forceSse = false }: { forceSse?: boolean } = {},
): void {
    vi.mocked(safeHttp.axios.request).mockImplementation(async (config) => {
        const requestConfig = config as { data?: string }
        const body = requestConfig.data ? JSON.parse(requestConfig.data) : {}
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


function tool(name: string): { name: string, inputSchema: Record<string, unknown> } {
    return {
        name,
        inputSchema: { type: 'object', properties: {} },
    }
}

function makeResponse(payload: unknown, sse: boolean): { data: string, headers: Record<string, string>, status: number } {
    if (sse) {
        return {
            data: `event: message\ndata: ${JSON.stringify(payload)}\n\n`,
            headers: SSE_HEADERS,
            status: 200,
        }
    }
    return { data: JSON.stringify(payload), headers: JSON_HEADERS, status: 200 }
}
