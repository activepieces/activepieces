import { createHash, randomBytes } from 'crypto'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { createTestContext, TestContext } from '../../../helpers/test-context'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

function generatePkce() {
    const codeVerifier = randomBytes(32).toString('base64url')
    const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url')
    return { codeVerifier, codeChallenge }
}

async function registerClient(platformId: string, redirectUri = 'http://localhost:3000/callback') {
    const response = await app!.inject({
        method: 'POST',
        url: '/v1/oauth/register',
        body: {
            client_name: 'Test Client',
            redirect_uris: [redirectUri],
            platform_id: platformId,
        },
    })
    return response.json()
}

async function performFullOAuthFlow(ctx: TestContext, overrides?: { redirectUri?: string }) {
    const redirectUri = overrides?.redirectUri ?? 'http://localhost:3000/callback'
    const { codeVerifier, codeChallenge } = generatePkce()

    const client = await registerClient(ctx.platform.id, redirectUri)

    const decisionResponse = await ctx.post('/v1/oauth/authorize/decision', {
        client_id: client.client_id,
        redirect_uri: redirectUri,
        scope: 'mcp:tools mcp:resources',
        state: 'test-state',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        approved: true,
    })
    const { redirectUrl } = decisionResponse.json()
    const code = new URL(redirectUrl).searchParams.get('code')!

    const tokenResponse = await app!.inject({
        method: 'POST',
        url: '/v1/oauth/token',
        body: {
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: client.client_id,
            code_verifier: codeVerifier,
        },
    })
    return { tokens: tokenResponse.json(), clientId: client.client_id, redirectUri, codeVerifier, codeChallenge }
}

describe('MCP User-Scoped Auth', () => {

    it('OAuth JWT works on MCP HTTP endpoint', async () => {
        const ctx = await createTestContext(app!)
        const { tokens } = await performFullOAuthFlow(ctx)

        const response = await app!.inject({
            method: 'POST',
            url: '/v1/mcp',
            headers: {
                authorization: `Bearer ${tokens.access_token}`,
            },
            body: {
                jsonrpc: '2.0',
                method: 'initialize',
                id: 1,
                params: {
                    protocolVersion: '2025-03-26',
                    capabilities: {},
                    clientInfo: { name: 'test', version: '1.0' },
                },
            },
        })
        // Should pass auth (not 401/403)
        expect(response.statusCode).not.toBe(StatusCodes.UNAUTHORIZED)
        expect(response.statusCode).not.toBe(StatusCodes.FORBIDDEN)
    })

    it('rejects request with no token (FORBIDDEN since UNKNOWN principal is not allowed)', async () => {
        const response = await app!.inject({
            method: 'POST',
            url: '/v1/mcp',
            body: {
                jsonrpc: '2.0',
                method: 'initialize',
                id: 1,
                params: {
                    protocolVersion: '2025-03-26',
                    capabilities: {},
                    clientInfo: { name: 'test', version: '1.0' },
                },
            },
        })
        expect(response.statusCode).toBe(StatusCodes.FORBIDDEN)
    })

    it('rejects regular session JWT on /http (only OAUTH allowed)', async () => {
        const ctx = await createTestContext(app!)

        const response = await ctx.post('/v1/mcp', {
            jsonrpc: '2.0',
            method: 'initialize',
            id: 1,
            params: {
                protocolVersion: '2025-03-26',
                capabilities: {},
                clientInfo: { name: 'test', version: '1.0' },
            },
        })
        expect(response.statusCode).toBe(StatusCodes.FORBIDDEN)
    })
})
