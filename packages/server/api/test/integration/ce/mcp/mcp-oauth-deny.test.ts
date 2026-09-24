import { FastifyInstance } from 'fastify'
import { beforeAll, describe, expect, it } from 'vitest'
import { JwtAudience, jwtUtils } from '../../../../src/app/helper/jwt-utils'
import { MCP_OAUTH_REDIRECT_URI, mcpOAuthTestHelpers } from '../../../helpers/mcp-oauth'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
let ctx: TestContext

const STATE = 'client-state-123'

async function startAuthorization({ state }: { state: string | null } = { state: STATE }): Promise<string> {
    const client = await mcpOAuthTestHelpers.registerClient({ app, tokenEndpointAuthMethod: 'none' })
    const { challenge } = mcpOAuthTestHelpers.generatePkce()

    const consent = await app.inject({
        method: 'GET',
        url: '/authorize?' + new URLSearchParams({
            client_id: client.client_id,
            redirect_uri: MCP_OAUTH_REDIRECT_URI,
            response_type: 'code',
            code_challenge: challenge,
            code_challenge_method: 'S256',
            scope: 'mcp',
            ...(state ? { state } : {}),
        }).toString(),
    })
    expect(consent.statusCode).toBe(302)

    return new URL(String(consent.headers.location), MCP_OAUTH_REDIRECT_URI).searchParams.get('authRequestId') ?? ''
}

async function signAuthRequest({ expiresInSeconds, type }: { expiresInSeconds: number, type: string }): Promise<string> {
    return jwtUtils.sign({
        payload: {
            clientId: 'irrelevant',
            clientName: 'Irrelevant',
            redirectUri: MCP_OAUTH_REDIRECT_URI,
            codeChallenge: 'x'.repeat(43),
            codeChallengeMethod: 'S256',
            state: STATE,
            scopes: ['mcp'],
            resource: null,
            type,
        },
        key: await jwtUtils.getJwtSecret(),
        expiresInSeconds,
        audience: JwtAudience.MCP_OAUTH_AUTH_REQUEST,
    })
}

describe('MCP OAuth deny', () => {
    beforeAll(async () => {
        app = await setupTestEnvironment()
        ctx = await createTestContext(app)
    })

    it('sends the client back with access_denied and its state, and no code', async () => {
        const authRequestId = await startAuthorization()

        const denied = await ctx.post('/v1/mcp-oauth/deny', { authRequestId })

        expect(denied.statusCode).toBe(200)
        const redirect = new URL(denied.json().redirectUrl)
        expect(redirect.origin + redirect.pathname).toBe(MCP_OAUTH_REDIRECT_URI)
        expect(redirect.searchParams.get('error')).toBe('access_denied')
        expect(redirect.searchParams.get('state')).toBe(STATE)
        expect(redirect.searchParams.get('code')).toBeNull()
    })

    it('omits state when the client sent none', async () => {
        const authRequestId = await startAuthorization({ state: null })

        const denied = await ctx.post('/v1/mcp-oauth/deny', { authRequestId })

        expect(denied.statusCode).toBe(200)
        const redirect = new URL(denied.json().redirectUrl)
        expect(redirect.searchParams.get('error')).toBe('access_denied')
        expect(redirect.searchParams.has('state')).toBe(false)
    })

    it('refuses a tampered request', async () => {
        const authRequestId = await startAuthorization()
        const [header, payload, signature] = authRequestId.split('.')
        const forged = JSON.parse(Buffer.from(payload, 'base64url').toString())
        forged.redirectUri = 'https://attacker.example/callback'
        const tampered = [header, Buffer.from(JSON.stringify(forged)).toString('base64url'), signature].join('.')

        const denied = await ctx.post('/v1/mcp-oauth/deny', { authRequestId: tampered })

        expect(denied.statusCode).toBe(400)
        expect(denied.json().error).toBe('invalid_request')
    })

    it('refuses an expired request', async () => {
        const authRequestId = await signAuthRequest({ expiresInSeconds: -1, type: 'mcp_auth_request' })

        const denied = await ctx.post('/v1/mcp-oauth/deny', { authRequestId })

        expect(denied.statusCode).toBe(400)
        expect(denied.json().error).toBe('invalid_request')
    })

    it('refuses a signed token that is not an authorization request', async () => {
        const authRequestId = await signAuthRequest({ expiresInSeconds: 600, type: 'something_else' })

        const denied = await ctx.post('/v1/mcp-oauth/deny', { authRequestId })

        expect(denied.statusCode).toBe(400)
        expect(denied.json().error).toBe('invalid_request')
    })
})
