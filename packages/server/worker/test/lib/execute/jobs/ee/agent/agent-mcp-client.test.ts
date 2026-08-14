import { AgentMcpTool, AgentToolType, McpAuthType, McpProtocol } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { agentMcpClient } from '../../../../../../src/lib/execute/jobs/ee/agent/agent-mcp-client'

const { mockCreateMCPClient } = vi.hoisted(() => ({
    mockCreateMCPClient: vi.fn(),
}))

vi.mock('@ai-sdk/mcp', () => ({
    createMCPClient: mockCreateMCPClient,
}))

afterEach(() => {
    mockCreateMCPClient.mockReset()
})

const ATTIO_TOOL = 'mcp__b1eec075-afc3-40da-b630-ab0693d3027d__list-records'

describe('agentMcpClient.classifyMcpAuthError', () => {
    describe('thrown errors', () => {
        it('flags a 401 status as an auth error and parses the connector uuid', () => {
            const result = agentMcpClient.classifyMcpAuthError({
                error: Object.assign(new Error('request failed'), { statusCode: 401 }),
                toolName: ATTIO_TOOL,
            })
            expect(result).toEqual({ isAuthError: true, connectorUuid: 'b1eec075-afc3-40da-b630-ab0693d3027d' })
        })

        it('flags a 403 nested in error.response.status', () => {
            const result = agentMcpClient.classifyMcpAuthError({
                error: { response: { status: 403 } },
                toolName: ATTIO_TOOL,
            })
            expect(result.isAuthError).toBe(true)
        })

        it('flags an auth message with no status code', () => {
            const result = agentMcpClient.classifyMcpAuthError({
                error: new Error('OAuth token has expired, please reconnect'),
                toolName: ATTIO_TOOL,
            })
            expect(result.isAuthError).toBe(true)
        })

        it('does not flag a generic error', () => {
            const result = agentMcpClient.classifyMcpAuthError({
                error: new Error('Record not found'),
                toolName: ATTIO_TOOL,
            })
            expect(result.isAuthError).toBe(false)
        })

        it('does not flag a timeout', () => {
            const result = agentMcpClient.classifyMcpAuthError({
                error: new Error('Tool execution timed out after 300000ms'),
                toolName: ATTIO_TOOL,
            })
            expect(result.isAuthError).toBe(false)
        })
    })

    describe('resolved error results', () => {
        it('flags an isError result whose text signals unauthorized', () => {
            const result = agentMcpClient.classifyMcpAuthError({
                result: { isError: true, content: [{ type: 'text', text: '401 Unauthorized' }] },
                toolName: ATTIO_TOOL,
            })
            expect(result.isAuthError).toBe(true)
        })

        it('does not flag an isError result with a non-auth message', () => {
            const result = agentMcpClient.classifyMcpAuthError({
                result: { isError: true, content: [{ type: 'text', text: 'Invalid filter parameter' }] },
                toolName: ATTIO_TOOL,
            })
            expect(result.isAuthError).toBe(false)
        })

        it('does not flag a successful result that merely mentions oauth', () => {
            const result = agentMcpClient.classifyMcpAuthError({
                result: { content: [{ type: 'text', text: 'Stored the oauth settings record' }] },
                toolName: ATTIO_TOOL,
            })
            expect(result.isAuthError).toBe(false)
        })

        it('does not flag an isError result whose user data merely contains the word reconnect', () => {
            const result = agentMcpClient.classifyMcpAuthError({
                result: { isError: true, content: [{ type: 'text', text: 'Deal "Reconnect Energy Corp" is past its close date' }] },
                toolName: ATTIO_TOOL,
            })
            expect(result.isAuthError).toBe(false)
        })

        it('does not flag an isError result whose user data mentions an invalid token field', () => {
            const result = agentMcpClient.classifyMcpAuthError({
                result: { isError: true, content: [{ type: 'text', text: 'Validation failed: the invalid_token attribute is read-only' }] },
                toolName: ATTIO_TOOL,
            })
            expect(result.isAuthError).toBe(false)
        })

        it('still flags an isError result that signals an expired token', () => {
            const result = agentMcpClient.classifyMcpAuthError({
                result: { isError: true, content: [{ type: 'text', text: 'Your token has expired' }] },
                toolName: ATTIO_TOOL,
            })
            expect(result.isAuthError).toBe(true)
        })
    })

    describe('connector uuid parsing', () => {
        it('returns null for a non-mcp tool name', () => {
            const result = agentMcpClient.classifyMcpAuthError({
                error: new Error('unauthorized'),
                toolName: 'ap_execute_action',
            })
            expect(result.connectorUuid).toBeNull()
            expect(result.isAuthError).toBe(true)
        })
    })
})

const CONNECTOR_UUID = 'b1eec075-afc3-40da-b630-ab0693d3027d'
const ATTIO_SEARCH = `mcp__${CONNECTOR_UUID}__search-records`

function makeAuthFailingTool(): { tool: { execute: () => Promise<unknown> }, calls: () => number } {
    let calls = 0
    return {
        tool: {
            execute: async () => {
                calls++
                throw Object.assign(new Error('request failed'), { statusCode: 401 })
            },
        },
        calls: () => calls,
    }
}

function reconnectText(result: unknown): string {
    const content = (result as { content?: Array<{ text?: string }> })?.content
    return content?.[0]?.text ?? ''
}

describe('agentMcpClient.withToolTimeouts circuit breaker', () => {
    it('flags a connector on the first auth error and short-circuits later calls to any of its tools without invoking them', async () => {
        const brokenConnectors = new Set<string>()
        const listRecords = makeAuthFailingTool()
        const searchRecords = makeAuthFailingTool()

        const wrapped = agentMcpClient.withToolTimeouts({
            mcpToolSet: { [ATTIO_TOOL]: listRecords.tool, [ATTIO_SEARCH]: searchRecords.tool },
            brokenConnectors,
        }) as Record<string, { execute: (args: unknown) => Promise<unknown> }>

        const first = await wrapped[ATTIO_TOOL].execute({})
        expect(reconnectText(first)).toContain('authentication failed')
        expect(brokenConnectors.has(CONNECTOR_UUID)).toBe(true)
        expect(listRecords.calls()).toBe(1)

        const second = await wrapped[ATTIO_SEARCH].execute({ query: 'acme' })
        expect(reconnectText(second)).toContain('already known to be broken')
        expect(searchRecords.calls()).toBe(0)
    })

    it('lets calls through again after the connector is cleared (reconnect approved)', async () => {
        const brokenConnectors = new Set<string>([CONNECTOR_UUID])
        const listRecords = makeAuthFailingTool()

        const wrapped = agentMcpClient.withToolTimeouts({
            mcpToolSet: { [ATTIO_TOOL]: listRecords.tool },
            brokenConnectors,
        }) as Record<string, { execute: (args: unknown) => Promise<unknown> }>

        const blocked = await wrapped[ATTIO_TOOL].execute({})
        expect(reconnectText(blocked)).toContain('already known to be broken')
        expect(listRecords.calls()).toBe(0)

        brokenConnectors.delete(CONNECTOR_UUID)
        await wrapped[ATTIO_TOOL].execute({})
        expect(listRecords.calls()).toBe(1)
    })
})

function createTestLogger(): { log: FastifyBaseLogger, warnCalls: unknown[][] } {
    const warnCalls: unknown[][] = []
    const log: FastifyBaseLogger = {
        level: 'info',
        silent: () => undefined,
        info: () => undefined,
        warn: (...args: unknown[]) => {
            warnCalls.push(args)
        },
        error: () => undefined,
        fatal: () => undefined,
        debug: () => undefined,
        trace: () => undefined,
        child: () => log,
    }
    return { log, warnCalls }
}

function agentMcpTool(overrides: Partial<AgentMcpTool> = {}): AgentMcpTool {
    return {
        type: AgentToolType.MCP,
        toolName: 'crm_server',
        serverUrl: 'https://example.com/mcp',
        protocol: McpProtocol.STREAMABLE_HTTP,
        auth: { type: McpAuthType.ACCESS_TOKEN, accessToken: 'shhh-secret-token' },
        ...overrides,
    }
}

function fakeMcpClient(toolSet: Record<string, unknown> = {}): { tools: () => Promise<Record<string, unknown>>, close: () => Promise<void> } {
    return {
        tools: async () => toolSet,
        close: async () => undefined,
    }
}

describe('agentMcpClient.withStepMcpTools — this IS the finally execute-agent-run.ts relies on', () => {
    it('closes every client it opened when the run callback (the rest of the turn) throws', async () => {
        const clientA = fakeMcpClient({ search: {} })
        const clientB = fakeMcpClient({ lookup: {} })
        const closeA = vi.spyOn(clientA, 'close')
        const closeB = vi.spyOn(clientB, 'close')
        mockCreateMCPClient.mockResolvedValueOnce(clientA).mockResolvedValueOnce(clientB)
        const tools = [agentMcpTool({ toolName: 'crm' }), agentMcpTool({ toolName: 'support' })]
        const { log } = createTestLogger()

        await expect(agentMcpClient.withStepMcpTools({
            tools,
            skip: false,
            log,
            run: async () => {
                throw new Error('the turn blew up mid-tool-call')
            },
        })).rejects.toThrow('the turn blew up mid-tool-call')

        expect(closeA).toHaveBeenCalledTimes(1)
        expect(closeB).toHaveBeenCalledTimes(1)
    })

    it('hands the merged tool set to the run callback and returns its result unchanged when the turn succeeds', async () => {
        mockCreateMCPClient.mockResolvedValueOnce(fakeMcpClient({ search_records: {} }))
        const { log } = createTestLogger()

        const result = await agentMcpClient.withStepMcpTools({
            tools: [agentMcpTool()],
            skip: false,
            log,
            run: async (toolSet) => ({ toolNames: Object.keys(toolSet), turnResult: 'done' }),
        })

        expect(result.toolNames).toHaveLength(1)
        expect(result.turnResult).toBe('done')
    })

    it('never opens a client and just runs the callback when skip is set (dry run / discovery only)', async () => {
        const { log } = createTestLogger()

        const result = await agentMcpClient.withStepMcpTools({
            tools: [agentMcpTool()],
            skip: true,
            log,
            run: async (toolSet) => Object.keys(toolSet).length,
        })

        expect(result).toBe(0)
        expect(mockCreateMCPClient).not.toHaveBeenCalled()
    })
})

describe('agentMcpClient.connectAgentMcpTools / closeAgentMcpTools — client lifecycle', () => {
    it('still closes every other client when one client\'s close() rejects', async () => {
        const clientA = fakeMcpClient()
        const clientB = fakeMcpClient()
        clientA.close = async () => {
            throw new Error('socket already gone')
        }
        const closeB = vi.spyOn(clientB, 'close')
        const { log, warnCalls } = createTestLogger()

        await agentMcpClient.closeAgentMcpTools({ clients: [clientA, clientB], tools: [agentMcpTool()], log })

        expect(closeB).toHaveBeenCalledTimes(1)
        expect(warnCalls).toHaveLength(1)
    })

    it('merges the tool sets from every configured MCP server, renamed through mcpToolNameUtils', async () => {
        mockCreateMCPClient
            .mockResolvedValueOnce(fakeMcpClient({ search_records: {} }))
            .mockResolvedValueOnce(fakeMcpClient({ list_deals: {} }))
        const tools = [agentMcpTool({ toolName: 'crm' }), agentMcpTool({ toolName: 'billing' })]
        const { log } = createTestLogger()

        const { toolSet } = await agentMcpClient.connectAgentMcpTools({ tools, log })

        expect(Object.keys(toolSet)).toHaveLength(2)
        expect(Object.keys(toolSet).every((name) => name.endsWith('_mcp'))).toBe(true)
    })

    it('skips a server that fails to connect and still returns the others\' tools', async () => {
        mockCreateMCPClient
            .mockRejectedValueOnce(new Error('connection refused'))
            .mockResolvedValueOnce(fakeMcpClient({ list_deals: {} }))
        const tools = [agentMcpTool({ toolName: 'down_server' }), agentMcpTool({ toolName: 'billing' })]
        const { log } = createTestLogger()

        const { clients, toolSet } = await agentMcpClient.connectAgentMcpTools({ tools, log })

        expect(clients).toHaveLength(1)
        expect(Object.keys(toolSet)).toHaveLength(1)
    })
})

describe('agentMcpClient — the auth config never reaches a log line', () => {
    it('redacts an access token found inside an arbitrary error message', () => {
        const secret = 'shhh-secret-token'
        const redacted = agentMcpClient.redactMcpAuthSecrets({
            text: `upstream rejected the call: Authorization: Bearer ${secret} was invalid`,
            secrets: [secret],
        })

        expect(redacted).not.toContain(secret)
        expect(redacted).toContain('[REDACTED]')
    })

    it('redacts every header value for a HEADERS auth config, not just the first', () => {
        const redacted = agentMcpClient.redactMcpAuthSecrets({
            text: 'failed with x-api-key=key-one and x-org-token=key-two',
            secrets: ['key-one', 'key-two'],
        })

        expect(redacted).not.toContain('key-one')
        expect(redacted).not.toContain('key-two')
    })

    it('never lets the access token reach the connect-failure log line', async () => {
        const secret = 'shhh-secret-token'
        mockCreateMCPClient.mockRejectedValueOnce(new Error(`401 from server, header was Bearer ${secret}`))
        const { log, warnCalls } = createTestLogger()

        await agentMcpClient.connectAgentMcpTools({ tools: [agentMcpTool({ auth: { type: McpAuthType.ACCESS_TOKEN, accessToken: secret } })], log })

        expect(warnCalls).toHaveLength(1)
        expect(JSON.stringify(warnCalls)).not.toContain(secret)
        expect(JSON.stringify(warnCalls)).toContain('[REDACTED]')
    })

    it('never lets an API key reach the tool-listing-failure log line', async () => {
        const secret = 'sk-do-not-leak-me'
        const client = fakeMcpClient()
        client.tools = async () => {
            throw new Error(`request failed, tried key ${secret}`)
        }
        mockCreateMCPClient.mockResolvedValueOnce(client)
        const { log, warnCalls } = createTestLogger()

        await agentMcpClient.connectAgentMcpTools({
            tools: [agentMcpTool({ auth: { type: McpAuthType.API_KEY, apiKey: secret, apiKeyHeader: 'x-api-key' } })],
            log,
        })

        expect(warnCalls).toHaveLength(1)
        expect(JSON.stringify(warnCalls)).not.toContain(secret)
    })
})
