import { AgentMcpTool, AgentToolType, McpAuthType, McpProtocol } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createMCPClientMock } = vi.hoisted(() => ({ createMCPClientMock: vi.fn() }))

vi.mock('@ai-sdk/mcp', () => ({ experimental_createMCPClient: createMCPClientMock }))
vi.mock('@modelcontextprotocol/sdk/client/sse.js', () => ({ SSEClientTransport: class SSEClientTransport {} }))
vi.mock('@modelcontextprotocol/sdk/client/streamableHttp.js', () => ({ StreamableHTTPClientTransport: class StreamableHTTPClientTransport {} }))

const { buildMcpTools } = await import('../../src/lib/ai/agent/tools/mcp-tools')

const mcpTool: AgentMcpTool = {
    type: AgentToolType.MCP,
    toolName: 'my_server',
    serverUrl: 'https://mcp.example.com/sse',
    protocol: McpProtocol.STREAMABLE_HTTP,
    auth: { type: McpAuthType.NONE },
}

const makeLogger = () => ({ warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() } as unknown as Parameters<typeof buildMcpTools>[0]['log'])

describe('buildMcpTools', () => {
    beforeEach(() => vi.clearAllMocks())

    it('connects, flattens server tools under sanitized names, and tracks the client for cleanup', async () => {
        const close = vi.fn().mockResolvedValue(undefined)
        createMCPClientMock.mockResolvedValue({ tools: async () => ({ 'list issues': { description: 'd', inputSchema: {}, execute: async () => ({}) } }), close })

        const { tools, toolKeyToAgentTool, mcpClients } = await buildMcpTools({ mcpTools: [mcpTool], log: makeLogger() })

        const key = Object.keys(tools)[0]
        expect(key).toBeDefined()
        expect(toolKeyToAgentTool[key]).toEqual(mcpTool)
        expect(mcpClients).toHaveLength(1)
        expect(close).not.toHaveBeenCalled()
    })

    it('skips a server that fails to connect without aborting the run', async () => {
        const log = makeLogger()
        createMCPClientMock.mockRejectedValue(new Error('connection refused'))

        const { tools, mcpClients } = await buildMcpTools({ mcpTools: [mcpTool], log })

        expect(Object.keys(tools)).toHaveLength(0)
        expect(mcpClients).toHaveLength(0)
        expect(log.warn).toHaveBeenCalled()
    })

    it('returns empty when there are no MCP tools (no client created)', async () => {
        const { tools, mcpClients } = await buildMcpTools({ mcpTools: [], log: makeLogger() })
        expect(Object.keys(tools)).toHaveLength(0)
        expect(mcpClients).toHaveLength(0)
        expect(createMCPClientMock).not.toHaveBeenCalled()
    })
})
