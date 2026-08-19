import { AgentToolType, McpAuthType, McpProtocol } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

const NOT_APPROVED_PATTERN = /approved by your platform admin/

function validateUrl(projectId: string): string {
    return `/v1/projects/${projectId}/agent-tools/mcp/validate`
}

function mcpToolBody(serverUrl: string): Record<string, unknown> {
    return {
        type: AgentToolType.MCP,
        toolName: 'my-tool',
        serverUrl,
        protocol: McpProtocol.STREAMABLE_HTTP,
        auth: { type: McpAuthType.NONE },
    }
}

describe('Agent MCP tool validate endpoint', () => {
    it('rejects an off-list endpoint with a clear error when an allowlist is configured', async () => {
        const ctx = await createTestContext(app, {
            platform: { mcpServerEndpointAllowlist: ['mcp.acme.com'] },
        })

        const response = await ctx.post(validateUrl(ctx.project.id), mcpToolBody('https://evil.example.com/sse'))

        expect(response.statusCode).toBe(StatusCodes.OK)
        const body = response.json()
        expect(body.toolNames).toBeUndefined()
        expect(body.error).toMatch(NOT_APPROVED_PATTERN)
    })

    it('lets an on-list endpoint through the gate (failure is the probe, not the allowlist)', async () => {
        const ctx = await createTestContext(app, {
            platform: { mcpServerEndpointAllowlist: ['localhost'] },
        })

        const response = await ctx.post(validateUrl(ctx.project.id), mcpToolBody('http://localhost:9999/mcp'))

        expect(response.statusCode).toBe(StatusCodes.OK)
        const body = response.json()
        expect(body.toolNames).toBeUndefined()
        expect(body.error).not.toMatch(NOT_APPROVED_PATTERN)
    })

    it('permits any endpoint when the allowlist is unset (opt-in passthrough)', async () => {
        const ctx = await createTestContext(app, {
            platform: { mcpServerEndpointAllowlist: null },
        })

        const response = await ctx.post(validateUrl(ctx.project.id), mcpToolBody('http://localhost:9999/mcp'))

        expect(response.statusCode).toBe(StatusCodes.OK)
        const body = response.json()
        expect(body.error).not.toMatch(NOT_APPROVED_PATTERN)
    })
})
