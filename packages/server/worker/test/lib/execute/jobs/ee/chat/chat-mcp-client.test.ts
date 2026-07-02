import { describe, expect, it } from 'vitest'
import { chatMcpClient } from '../../../../../../src/lib/execute/jobs/ee/chat/chat-mcp-client'

const ATTIO_TOOL = 'mcp__b1eec075-afc3-40da-b630-ab0693d3027d__list-records'

describe('chatMcpClient.classifyMcpAuthError', () => {
    describe('thrown errors', () => {
        it('flags a 401 status as an auth error and parses the connector uuid', () => {
            const result = chatMcpClient.classifyMcpAuthError({
                error: Object.assign(new Error('request failed'), { statusCode: 401 }),
                toolName: ATTIO_TOOL,
            })
            expect(result).toEqual({ isAuthError: true, connectorUuid: 'b1eec075-afc3-40da-b630-ab0693d3027d' })
        })

        it('flags a 403 nested in error.response.status', () => {
            const result = chatMcpClient.classifyMcpAuthError({
                error: { response: { status: 403 } },
                toolName: ATTIO_TOOL,
            })
            expect(result.isAuthError).toBe(true)
        })

        it('flags an auth message with no status code', () => {
            const result = chatMcpClient.classifyMcpAuthError({
                error: new Error('OAuth token has expired, please reconnect'),
                toolName: ATTIO_TOOL,
            })
            expect(result.isAuthError).toBe(true)
        })

        it('does not flag a generic error', () => {
            const result = chatMcpClient.classifyMcpAuthError({
                error: new Error('Record not found'),
                toolName: ATTIO_TOOL,
            })
            expect(result.isAuthError).toBe(false)
        })

        it('does not flag a timeout', () => {
            const result = chatMcpClient.classifyMcpAuthError({
                error: new Error('Tool execution timed out after 300000ms'),
                toolName: ATTIO_TOOL,
            })
            expect(result.isAuthError).toBe(false)
        })
    })

    describe('resolved error results', () => {
        it('flags an isError result whose text signals unauthorized', () => {
            const result = chatMcpClient.classifyMcpAuthError({
                result: { isError: true, content: [{ type: 'text', text: '401 Unauthorized' }] },
                toolName: ATTIO_TOOL,
            })
            expect(result.isAuthError).toBe(true)
        })

        it('does not flag an isError result with a non-auth message', () => {
            const result = chatMcpClient.classifyMcpAuthError({
                result: { isError: true, content: [{ type: 'text', text: 'Invalid filter parameter' }] },
                toolName: ATTIO_TOOL,
            })
            expect(result.isAuthError).toBe(false)
        })

        it('does not flag a successful result that merely mentions oauth', () => {
            const result = chatMcpClient.classifyMcpAuthError({
                result: { content: [{ type: 'text', text: 'Stored the oauth settings record' }] },
                toolName: ATTIO_TOOL,
            })
            expect(result.isAuthError).toBe(false)
        })

        it('does not flag an isError result whose user data merely contains the word reconnect', () => {
            const result = chatMcpClient.classifyMcpAuthError({
                result: { isError: true, content: [{ type: 'text', text: 'Deal "Reconnect Energy Corp" is past its close date' }] },
                toolName: ATTIO_TOOL,
            })
            expect(result.isAuthError).toBe(false)
        })

        it('does not flag an isError result whose user data mentions an invalid token field', () => {
            const result = chatMcpClient.classifyMcpAuthError({
                result: { isError: true, content: [{ type: 'text', text: 'Validation failed: the invalid_token attribute is read-only' }] },
                toolName: ATTIO_TOOL,
            })
            expect(result.isAuthError).toBe(false)
        })

        it('still flags an isError result that signals an expired token', () => {
            const result = chatMcpClient.classifyMcpAuthError({
                result: { isError: true, content: [{ type: 'text', text: 'Your token has expired' }] },
                toolName: ATTIO_TOOL,
            })
            expect(result.isAuthError).toBe(true)
        })
    })

    describe('connector uuid parsing', () => {
        it('returns null for a non-mcp tool name', () => {
            const result = chatMcpClient.classifyMcpAuthError({
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

describe('chatMcpClient.withToolTimeouts circuit breaker', () => {
    it('flags a connector on the first auth error and short-circuits later calls to any of its tools without invoking them', async () => {
        const brokenConnectors = new Set<string>()
        const listRecords = makeAuthFailingTool()
        const searchRecords = makeAuthFailingTool()

        const wrapped = chatMcpClient.withToolTimeouts({
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

        const wrapped = chatMcpClient.withToolTimeouts({
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

const PROPS_TOOL = 'ap_get_piece_props'

describe('chatMcpClient.injectSelectedAuth — authoritative selected connection (BE-07)', () => {
    it('injects the selected connection externalId for an auth-injectable tool', () => {
        const args = chatMcpClient.injectSelectedAuth({
            name: PROPS_TOOL,
            args: { pieceName: '@activepieces/piece-gmail', actionName: 'send_email' },
            getSelectedAuth: ({ pieceName }) => (pieceName === '@activepieces/piece-gmail' ? 'conn_gmail' : undefined),
        })
        expect(args).toEqual({ pieceName: '@activepieces/piece-gmail', actionName: 'send_email', auth: 'conn_gmail' })
    })

    it('normalizes the piece name before resolving the selected connection', () => {
        const seen: string[] = []
        chatMcpClient.injectSelectedAuth({
            name: PROPS_TOOL,
            args: { pieceName: 'gmail' },
            getSelectedAuth: ({ pieceName }) => { seen.push(pieceName); return undefined },
        })
        expect(seen).toEqual(['@activepieces/piece-gmail'])
    })

    it('does not inject for a tool that is not auth-injectable', () => {
        const input = { pieceName: '@activepieces/piece-gmail' }
        const args = chatMcpClient.injectSelectedAuth({ name: 'ap_execute_action', args: input, getSelectedAuth: () => 'conn_gmail' })
        expect(args).toBe(input)
    })

    it('returns args unchanged when there is no resolver', () => {
        const input = { pieceName: '@activepieces/piece-gmail' }
        expect(chatMcpClient.injectSelectedAuth({ name: PROPS_TOOL, args: input })).toBe(input)
    })

    it('returns args unchanged when no connection is selected for the piece', () => {
        const input = { pieceName: '@activepieces/piece-gmail' }
        const args = chatMcpClient.injectSelectedAuth({ name: PROPS_TOOL, args: input, getSelectedAuth: () => undefined })
        expect(args).toBe(input)
    })

    it('does not clobber an auth that already matches the selected connection', () => {
        const input = { pieceName: '@activepieces/piece-gmail', auth: 'conn_gmail' }
        const args = chatMcpClient.injectSelectedAuth({ name: PROPS_TOOL, args: input, getSelectedAuth: () => 'conn_gmail' })
        expect(args).toBe(input)
    })
})
