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

describe('OAuth 2.1 Provider', () => {

    describe('Well-Known Metadata', () => {

        it('GET /.well-known/oauth-authorization-server returns correct metadata', async () => {
            const response = await app!.inject({
                method: 'GET',
                url: '/.well-known/oauth-authorization-server',
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json()
            expect(body.issuer).toBeDefined()
            expect(body.authorization_endpoint).toContain('/v1/oauth/authorize')
            expect(body.token_endpoint).toContain('/v1/oauth/token')
            expect(body.registration_endpoint).toContain('/v1/oauth/register')
            expect(body.revocation_endpoint).toContain('/v1/oauth/revoke')
            expect(body.response_types_supported).toContain('code')
            expect(body.grant_types_supported).toContain('authorization_code')
            expect(body.grant_types_supported).toContain('refresh_token')
            expect(body.code_challenge_methods_supported).toContain('S256')
            expect(body.scopes_supported).toBeDefined()
            expect(body.token_endpoint_auth_methods_supported).toContain('none')
            expect(body.token_endpoint_auth_methods_supported).toContain('client_secret_post')
        })

        it('GET /.well-known/oauth-protected-resource returns resource metadata', async () => {
            const response = await app!.inject({
                method: 'GET',
                url: '/.well-known/oauth-protected-resource/api/v1/mcp',
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json()
            expect(body.resource).toContain('/mcp')
            expect(body.authorization_servers).toBeDefined()
            expect(body.authorization_servers.length).toBeGreaterThan(0)
            expect(body.scopes_supported).toBeDefined()
        })
    })

    describe('Client Registration', () => {

        it('registers a public client successfully', async () => {
            const ctx = await createTestContext(app!)
            const response = await app!.inject({
                method: 'POST',
                url: '/v1/oauth/register',
                body: {
                    client_name: 'My Test App',
                    redirect_uris: ['http://localhost:3000/callback'],
                    platform_id: ctx.platform.id,
                },
            })
            expect(response.statusCode).toBe(StatusCodes.CREATED)
            const body = response.json()
            expect(body.client_id).toBeDefined()
            expect(body.client_id).toMatch(/^ap_oauth_/)
            expect(body.client_name).toBe('My Test App')
            expect(body.redirect_uris).toEqual(['http://localhost:3000/callback'])
            expect(body.grant_types).toContain('authorization_code')
            expect(body.grant_types).toContain('refresh_token')
            expect(body.client_secret).toBeNull()
            expect(body.token_endpoint_auth_method).toBe('none')
        })

        it('registers a confidential client with secret', async () => {
            const ctx = await createTestContext(app!)
            const response = await app!.inject({
                method: 'POST',
                url: '/v1/oauth/register',
                body: {
                    client_name: 'Confidential App',
                    redirect_uris: ['http://localhost:3000/callback'],
                    token_endpoint_auth_method: 'client_secret_post',
                    platform_id: ctx.platform.id,
                },
            })
            expect(response.statusCode).toBe(StatusCodes.CREATED)
            const body = response.json()
            expect(body.client_id).toBeDefined()
            expect(body.client_secret).toBeDefined()
            expect(body.client_secret).not.toBeNull()
            expect(body.token_endpoint_auth_method).toBe('client_secret_post')
        })

        it('rejects registration without platform_id', async () => {
            const response = await app!.inject({
                method: 'POST',
                url: '/v1/oauth/register',
                body: {
                    client_name: 'Bad Client',
                    redirect_uris: ['http://localhost:3000/callback'],
                },
            })
            expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST)
        })
    })

    describe('Authorization Endpoint', () => {

        it('redirects to consent page with valid params', async () => {
            const ctx = await createTestContext(app!)
            const { codeChallenge } = generatePkce()
            const client = await registerClient(ctx.platform.id)

            const response = await app!.inject({
                method: 'GET',
                url: '/v1/oauth/authorize',
                query: {
                    client_id: client.client_id,
                    redirect_uri: 'http://localhost:3000/callback',
                    response_type: 'code',
                    scope: 'mcp:tools',
                    state: 'xyz',
                    code_challenge: codeChallenge,
                    code_challenge_method: 'S256',
                },
            })
            expect(response.statusCode).toBe(StatusCodes.MOVED_TEMPORARILY)
            const location = response.headers.location as string
            expect(location).toContain('/oauth/consent')
            expect(location).toContain('client_id=' + encodeURIComponent(client.client_id))
            expect(location).toContain('state=xyz')
        })

        it('rejects invalid response_type', async () => {
            const ctx = await createTestContext(app!)
            const { codeChallenge } = generatePkce()
            const client = await registerClient(ctx.platform.id)

            const response = await app!.inject({
                method: 'GET',
                url: '/v1/oauth/authorize',
                query: {
                    client_id: client.client_id,
                    redirect_uri: 'http://localhost:3000/callback',
                    response_type: 'token',
                    scope: 'mcp:tools',
                    code_challenge: codeChallenge,
                    code_challenge_method: 'S256',
                },
            })
            expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST)
            const body = response.json()
            expect(body.error).toBe('unsupported_response_type')
        })

        it('rejects missing PKCE code_challenge', async () => {
            const ctx = await createTestContext(app!)
            const client = await registerClient(ctx.platform.id)

            const response = await app!.inject({
                method: 'GET',
                url: '/v1/oauth/authorize',
                query: {
                    client_id: client.client_id,
                    redirect_uri: 'http://localhost:3000/callback',
                    response_type: 'code',
                    scope: 'mcp:tools',
                    code_challenge_method: 'S256',
                },
            })
            // code_challenge is required by schema, so this should fail validation
            expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST)
        })

        it('rejects unknown client_id', async () => {
            const { codeChallenge } = generatePkce()

            const response = await app!.inject({
                method: 'GET',
                url: '/v1/oauth/authorize',
                query: {
                    client_id: 'nonexistent',
                    redirect_uri: 'http://localhost:3000/callback',
                    response_type: 'code',
                    scope: 'mcp:tools',
                    code_challenge: codeChallenge,
                    code_challenge_method: 'S256',
                },
            })
            expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST)
            const body = response.json()
            expect(body.error).toBe('invalid_client')
        })

        it('rejects redirect_uri not in registered list', async () => {
            const ctx = await createTestContext(app!)
            const { codeChallenge } = generatePkce()
            const client = await registerClient(ctx.platform.id)

            const response = await app!.inject({
                method: 'GET',
                url: '/v1/oauth/authorize',
                query: {
                    client_id: client.client_id,
                    redirect_uri: 'http://evil.com/callback',
                    response_type: 'code',
                    scope: 'mcp:tools',
                    code_challenge: codeChallenge,
                    code_challenge_method: 'S256',
                },
            })
            expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST)
            const body = response.json()
            expect(body.error).toBe('invalid_request')
        })
    })

    describe('Authorization Decision', () => {

        it('returns redirect URL with code when approved', async () => {
            const ctx = await createTestContext(app!)
            const { codeChallenge } = generatePkce()
            const client = await registerClient(ctx.platform.id)

            const response = await ctx.post('/v1/oauth/authorize/decision', {
                client_id: client.client_id,
                redirect_uri: 'http://localhost:3000/callback',
                scope: 'mcp:tools mcp:resources',
                state: 'test-state-123',
                code_challenge: codeChallenge,
                code_challenge_method: 'S256',
                approved: true,
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json()
            expect(body.redirectUrl).toBeDefined()
            const url = new URL(body.redirectUrl)
            expect(url.searchParams.get('code')).toBeDefined()
            expect(url.searchParams.get('code')!.length).toBeGreaterThan(0)
            expect(url.searchParams.get('state')).toBe('test-state-123')
        })

        it('returns redirect URL with error when denied', async () => {
            const ctx = await createTestContext(app!)
            const { codeChallenge } = generatePkce()
            const client = await registerClient(ctx.platform.id)

            const response = await ctx.post('/v1/oauth/authorize/decision', {
                client_id: client.client_id,
                redirect_uri: 'http://localhost:3000/callback',
                scope: 'mcp:tools',
                state: 'deny-state',
                code_challenge: codeChallenge,
                code_challenge_method: 'S256',
                approved: false,
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json()
            expect(body.redirectUrl).toBeDefined()
            const url = new URL(body.redirectUrl)
            expect(url.searchParams.get('error')).toBe('access_denied')
            expect(url.searchParams.get('state')).toBe('deny-state')
        })

        it('rejects unauthenticated request', async () => {
            const ctx = await createTestContext(app!)
            const { codeChallenge } = generatePkce()
            const client = await registerClient(ctx.platform.id)

            const response = await app!.inject({
                method: 'POST',
                url: '/v1/oauth/authorize/decision',
                body: {
                    client_id: client.client_id,
                    redirect_uri: 'http://localhost:3000/callback',
                    scope: 'mcp:tools',
                    code_challenge: codeChallenge,
                    code_challenge_method: 'S256',
                    approved: true,
                },
            })
            expect(response.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })

    describe('Token Exchange', () => {

        it('exchanges authorization code for tokens successfully', async () => {
            const ctx = await createTestContext(app!)
            const { tokens } = await performFullOAuthFlow(ctx)

            expect(tokens.access_token).toBeDefined()
            expect(tokens.refresh_token).toBeDefined()
            expect(tokens.token_type).toBe('Bearer')
            expect(tokens.expires_in).toBe(3600)
            expect(tokens.scope).toBeDefined()
        })

        it('rejects wrong PKCE code_verifier', async () => {
            const ctx = await createTestContext(app!)
            const { codeChallenge } = generatePkce()
            const client = await registerClient(ctx.platform.id)
            const redirectUri = 'http://localhost:3000/callback'

            const decisionResponse = await ctx.post('/v1/oauth/authorize/decision', {
                client_id: client.client_id,
                redirect_uri: redirectUri,
                scope: 'mcp:tools',
                code_challenge: codeChallenge,
                code_challenge_method: 'S256',
                approved: true,
            })
            const { redirectUrl } = decisionResponse.json()
            const code = new URL(redirectUrl).searchParams.get('code')!

            const response = await app!.inject({
                method: 'POST',
                url: '/v1/oauth/token',
                body: {
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: redirectUri,
                    client_id: client.client_id,
                    code_verifier: 'wrong-verifier-value',
                },
            })
            expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST)
            const body = response.json()
            expect(body.error).toBe('invalid_grant')
        })

        it('rejects code reuse', async () => {
            const ctx = await createTestContext(app!)
            const { codeVerifier, codeChallenge } = generatePkce()
            const client = await registerClient(ctx.platform.id)
            const redirectUri = 'http://localhost:3000/callback'

            const decisionResponse = await ctx.post('/v1/oauth/authorize/decision', {
                client_id: client.client_id,
                redirect_uri: redirectUri,
                scope: 'mcp:tools',
                code_challenge: codeChallenge,
                code_challenge_method: 'S256',
                approved: true,
            })
            const { redirectUrl } = decisionResponse.json()
            const code = new URL(redirectUrl).searchParams.get('code')!

            // First exchange — should succeed
            const firstResponse = await app!.inject({
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
            expect(firstResponse.statusCode).toBe(StatusCodes.OK)

            // Second exchange — should fail
            const secondResponse = await app!.inject({
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
            expect(secondResponse.statusCode).toBe(StatusCodes.BAD_REQUEST)
            expect(secondResponse.json().error).toBe('invalid_grant')
        })

        it('rejects wrong client_id on code exchange', async () => {
            const ctx = await createTestContext(app!)
            const { codeVerifier, codeChallenge } = generatePkce()
            const client = await registerClient(ctx.platform.id)
            const otherClient = await registerClient(ctx.platform.id)
            const redirectUri = 'http://localhost:3000/callback'

            const decisionResponse = await ctx.post('/v1/oauth/authorize/decision', {
                client_id: client.client_id,
                redirect_uri: redirectUri,
                scope: 'mcp:tools',
                code_challenge: codeChallenge,
                code_challenge_method: 'S256',
                approved: true,
            })
            const { redirectUrl } = decisionResponse.json()
            const code = new URL(redirectUrl).searchParams.get('code')!

            const response = await app!.inject({
                method: 'POST',
                url: '/v1/oauth/token',
                body: {
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: redirectUri,
                    client_id: otherClient.client_id,
                    code_verifier: codeVerifier,
                },
            })
            expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST)
            expect(response.json().error).toBe('invalid_grant')
        })

        it('rejects wrong redirect_uri on code exchange', async () => {
            const ctx = await createTestContext(app!)
            const { codeVerifier, codeChallenge } = generatePkce()
            const client = await registerClient(ctx.platform.id)
            const redirectUri = 'http://localhost:3000/callback'

            const decisionResponse = await ctx.post('/v1/oauth/authorize/decision', {
                client_id: client.client_id,
                redirect_uri: redirectUri,
                scope: 'mcp:tools',
                code_challenge: codeChallenge,
                code_challenge_method: 'S256',
                approved: true,
            })
            const { redirectUrl } = decisionResponse.json()
            const code = new URL(redirectUrl).searchParams.get('code')!

            const response = await app!.inject({
                method: 'POST',
                url: '/v1/oauth/token',
                body: {
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: 'http://wrong.com/callback',
                    client_id: client.client_id,
                    code_verifier: codeVerifier,
                },
            })
            expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST)
            expect(response.json().error).toBe('invalid_grant')
        })

        it('rejects unsupported grant_type', async () => {
            const response = await app!.inject({
                method: 'POST',
                url: '/v1/oauth/token',
                body: {
                    grant_type: 'client_credentials',
                    client_id: 'some-client',
                },
            })
            expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST)
            expect(response.json().error).toBe('unsupported_grant_type')
        })
    })

    describe('Refresh Token', () => {

        it('refreshes access token successfully', async () => {
            const ctx = await createTestContext(app!)
            const { tokens, clientId } = await performFullOAuthFlow(ctx)

            const response = await app!.inject({
                method: 'POST',
                url: '/v1/oauth/token',
                body: {
                    grant_type: 'refresh_token',
                    refresh_token: tokens.refresh_token,
                    client_id: clientId,
                },
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json()
            expect(body.access_token).toBeDefined()
            expect(body.refresh_token).toBeDefined()
            expect(body.token_type).toBe('Bearer')
            expect(body.expires_in).toBe(3600)
            // Refresh token should always differ (newly generated random token)
            expect(body.refresh_token).not.toBe(tokens.refresh_token)
        })

        it('revokes old refresh token after refresh', async () => {
            const ctx = await createTestContext(app!)
            const { tokens, clientId } = await performFullOAuthFlow(ctx)
            const oldRefreshToken = tokens.refresh_token

            // First refresh — should succeed
            const refreshResponse = await app!.inject({
                method: 'POST',
                url: '/v1/oauth/token',
                body: {
                    grant_type: 'refresh_token',
                    refresh_token: oldRefreshToken,
                    client_id: clientId,
                },
            })
            expect(refreshResponse.statusCode).toBe(StatusCodes.OK)

            // Second refresh with old token — should fail
            const secondResponse = await app!.inject({
                method: 'POST',
                url: '/v1/oauth/token',
                body: {
                    grant_type: 'refresh_token',
                    refresh_token: oldRefreshToken,
                    client_id: clientId,
                },
            })
            expect(secondResponse.statusCode).toBe(StatusCodes.BAD_REQUEST)
            expect(secondResponse.json().error).toBe('invalid_grant')
        })

        it('rejects refresh with wrong client_id', async () => {
            const ctx = await createTestContext(app!)
            const { tokens } = await performFullOAuthFlow(ctx)
            const otherClient = await registerClient(ctx.platform.id)

            const response = await app!.inject({
                method: 'POST',
                url: '/v1/oauth/token',
                body: {
                    grant_type: 'refresh_token',
                    refresh_token: tokens.refresh_token,
                    client_id: otherClient.client_id,
                },
            })
            expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST)
            expect(response.json().error).toBe('invalid_grant')
        })
    })

    describe('Token Revocation', () => {

        it('revokes a refresh token successfully', async () => {
            const ctx = await createTestContext(app!)
            const { tokens, clientId } = await performFullOAuthFlow(ctx)

            // Revoke the refresh token
            const revokeResponse = await app!.inject({
                method: 'POST',
                url: '/v1/oauth/revoke',
                body: {
                    token: tokens.refresh_token,
                },
            })
            expect(revokeResponse.statusCode).toBe(StatusCodes.OK)

            // Try to use the revoked token — should fail
            const refreshResponse = await app!.inject({
                method: 'POST',
                url: '/v1/oauth/token',
                body: {
                    grant_type: 'refresh_token',
                    refresh_token: tokens.refresh_token,
                    client_id: clientId,
                },
            })
            expect(refreshResponse.statusCode).toBe(StatusCodes.BAD_REQUEST)
            expect(refreshResponse.json().error).toBe('invalid_grant')
        })

        it('returns 200 for unknown token (idempotent)', async () => {
            const response = await app!.inject({
                method: 'POST',
                url: '/v1/oauth/revoke',
                body: {
                    token: 'nonexistent-token-value',
                },
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
        })
    })

    describe('Auth Middleware — OAuth JWT Recognition', () => {

        it('accepts OAuth JWT on protected endpoint', async () => {
            const ctx = await createTestContext(app!)
            const { tokens } = await performFullOAuthFlow(ctx)

            const response = await app!.inject({
                method: 'GET',
                url: '/v1/mcp-server',
                headers: {
                    authorization: `Bearer ${tokens.access_token}`,
                },
            })
            // OAuth JWT should be recognized and grant access
            expect(response.statusCode).toBe(StatusCodes.OK)
        })

        it('regular session JWT still works on protected endpoints', async () => {
            const ctx = await createTestContext(app!)

            const response = await ctx.get('/v1/mcp-server')
            expect(response.statusCode).toBe(StatusCodes.OK)
        })
    })

})
