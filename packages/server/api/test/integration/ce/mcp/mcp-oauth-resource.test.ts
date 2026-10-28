import { FastifyInstance } from 'fastify'
import { beforeAll, describe, expect, it } from 'vitest'
import { MCP_OAUTH_REDIRECT_URI, mcpOAuthTestHelpers } from '../../../helpers/mcp-oauth'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
let ctx: TestContext

async function authorize({ resource }: { resource?: string }): Promise<string> {
    const client = await mcpOAuthTestHelpers.registerClient({ app, tokenEndpointAuthMethod: 'none' })
    const { challenge } = mcpOAuthTestHelpers.generatePkce()
    const res = await app.inject({
        method: 'GET',
        url: '/authorize?' + new URLSearchParams({
            client_id: client.client_id,
            redirect_uri: MCP_OAUTH_REDIRECT_URI,
            response_type: 'code',
            code_challenge: challenge,
            code_challenge_method: 'S256',
            ...(resource ? { resource } : {}),
        }).toString(),
    })
    expect(res.statusCode).toBe(302)
    return new URL(String(res.headers.location), MCP_OAUTH_REDIRECT_URI).searchParams.get('authRequestId') ?? ''
}

describe('MCP OAuth approve matches the requested resource', () => {
    beforeAll(async () => {
        app = await setupTestEnvironment()
        ctx = await createTestContext(app)
    })

    it.each([
        { resource: 'http://localhost:4200/mcp/platform', withProject: false, approved: true },
        { resource: 'http://localhost:4200/mcp/platform/', withProject: false, approved: true },
        { resource: 'https://other.example.com/mcp/platform', withProject: false, approved: true },
        { resource: 'http://localhost:4200/mcp/platform', withProject: true, approved: false },
        { resource: 'http://localhost:4200/mcp', withProject: true, approved: true },
        { resource: 'http://localhost:4200/mcp', withProject: false, approved: false },
        { resource: undefined, withProject: true, approved: true },
        { resource: undefined, withProject: false, approved: false },
    ])('resource $resource with project=$withProject is approved: $approved', async ({ resource, withProject, approved }) => {
        const authRequestId = await authorize({ resource })

        const res = await ctx.post('/v1/mcp-oauth/approve', {
            authRequestId,
            ...(withProject ? { projectId: ctx.project.id } : {}),
        })

        if (approved) {
            expect(res.statusCode).toBe(200)
        }
        else {
            expect(res.statusCode).toBe(400)
            expect(res.json().error_description).toBe('Project access needs a projectId and platform access must not have one')
        }
    })
})
