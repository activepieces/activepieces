import { apId } from '@activepieces/core-utils'
import {
    AgentTool,
    AgentToolType,
    McpAuthType,
    McpProtocol,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { agentHelpers } from '../../../../src/app/ee/agent/agent-helpers'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

const ON_LIST_URL = 'https://mcp.acme.com/sse'
const SUBDOMAIN_URL = 'https://tools.acme.com/sse'
const OFF_LIST_URL = 'https://evil.example.com/sse'

function mcpTool(toolName: string, serverUrl: string): AgentTool {
    return {
        type: AgentToolType.MCP,
        toolName,
        serverUrl,
        protocol: McpProtocol.STREAMABLE_HTTP,
        auth: { type: McpAuthType.NONE },
    }
}

describe('assertMcpEndpointsApproved — MCP endpoint allowlist enforcement', () => {
    it('Rejects the run when an MCP tool points at an endpoint that is not on the allowlist', async () => {
        const ctx = await createTestContext(app, {
            platform: { mcpServerEndpointAllowlist: ['mcp.acme.com'] },
        })

        await expect(agentHelpers.assertMcpEndpointsApproved({
            platformId: ctx.platform.id,
            tools: [mcpTool('on-list', ON_LIST_URL), mcpTool('off-list', OFF_LIST_URL)],
            log: app.log,
        })).rejects.toThrow(OFF_LIST_URL)
    })

    it('Allows exact and wildcard matches', async () => {
        const ctx = await createTestContext(app, {
            platform: { mcpServerEndpointAllowlist: ['mcp.acme.com', '*.acme.com'] },
        })

        await expect(agentHelpers.assertMcpEndpointsApproved({
            platformId: ctx.platform.id,
            tools: [mcpTool('exact', ON_LIST_URL), mcpTool('wildcard', SUBDOMAIN_URL)],
            log: app.log,
        })).resolves.toBeUndefined()
    })

    it('Allows every endpoint when the allowlist is unset', async () => {
        const ctx = await createTestContext(app, {
            platform: { mcpServerEndpointAllowlist: null },
        })

        await expect(agentHelpers.assertMcpEndpointsApproved({
            platformId: ctx.platform.id,
            tools: [mcpTool('off-list', OFF_LIST_URL)],
            log: app.log,
        })).resolves.toBeUndefined()
    })

    it('Reads no platform row when the run carries no MCP tools', async () => {
        await expect(agentHelpers.assertMcpEndpointsApproved({
            platformId: apId(),
            tools: [{
                type: AgentToolType.PIECE,
                toolName: 'piece-tool',
                pieceMetadata: {
                    pieceName: '@activepieces/piece-http',
                    pieceVersion: '0.0.1',
                    actionName: 'send_request',
                },
            }],
            log: app.log,
        })).resolves.toBeUndefined()
    })
})
