import { createPublicKey, JsonWebKey } from 'node:crypto'
import { DefaultProjectRole } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import jwtLibrary from 'jsonwebtoken'
import { beforeAll, describe, expect, it } from 'vitest'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { MCP_OAUTH_REDIRECT_URI, mcpOAuthTestHelpers } from '../../../helpers/mcp-oauth'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
let ctx: TestContext

async function discoveredIssuer(headers?: Record<string, string>): Promise<string> {
    const res = await app.inject({ method: 'GET', url: '/.well-known/openid-configuration', headers })
    return res.json().issuer
}

async function completeFlow({ scope, nonce, headers, ctx: flowCtx = ctx }: { scope: string, nonce?: string, headers?: Record<string, string>, ctx?: TestContext }): Promise<TokenResponse> {
    const client = await mcpOAuthTestHelpers.registerClient({ app, tokenEndpointAuthMethod: 'none' })
    const { verifier, challenge } = mcpOAuthTestHelpers.generatePkce()

    const query: Record<string, string> = {
        client_id: client.client_id,
        redirect_uri: MCP_OAUTH_REDIRECT_URI,
        response_type: 'code',
        code_challenge: challenge,
        code_challenge_method: 'S256',
        scope,
    }
    if (nonce !== undefined) {
        query.nonce = nonce
    }

    const consent = await app.inject({ method: 'GET', url: '/authorize?' + new URLSearchParams(query).toString(), headers })
    expect(consent.statusCode).toBe(302)

    const authRequestId = new URL(String(consent.headers.location), MCP_OAUTH_REDIRECT_URI).searchParams.get('authRequestId')
    const approved = await flowCtx.post('/v1/mcp-oauth/approve', { authRequestId, projectId: flowCtx.project.id })
    expect(approved.statusCode).toBe(200)

    const code = new URL(approved.json().redirectUrl).searchParams.get('code')
    const token = await app.inject({
        method: 'POST',
        url: '/token',
        headers,
        payload: {
            grant_type: 'authorization_code',
            code,
            code_verifier: verifier,
            redirect_uri: MCP_OAUTH_REDIRECT_URI,
            client_id: client.client_id,
        },
    })
    expect(token.statusCode).toBe(200)

    const issued: IssuedTokens = token.json()
    return { ...issued, clientId: client.client_id }
}

async function verifyIdToken(idToken: string): Promise<Record<string, unknown>> {
    const jwks = await app.inject({ method: 'GET', url: '/.well-known/jwks.json' })
    expect(jwks.statusCode).toBe(200)
    const [jwk] = jwks.json().keys as JsonWebKey[]
    const publicKey = createPublicKey({ key: jwk, format: 'jwk' })
    return jwtLibrary.verify(idToken, publicKey, { algorithms: ['RS256'] }) as Record<string, unknown>
}

describe('MCP OAuth OpenID Connect', () => {
    beforeAll(async () => {
        app = await setupTestEnvironment({ fresh: true })
        ctx = await createTestContext(app)
    })

    it('publishes an OIDC discovery document advertising openid and email', async () => {
        const res = await app.inject({ method: 'GET', url: '/.well-known/openid-configuration' })

        expect(res.statusCode).toBe(200)
        const body = res.json()
        const issuer = body.issuer
        expect(body.jwks_uri).toBe(`${issuer}/.well-known/jwks.json`)
        expect(body.authorization_endpoint).toBe(`${issuer}/authorize`)
        expect(body.token_endpoint).toBe(`${issuer}/token`)
        expect(body.userinfo_endpoint).toBe(`${issuer}/userinfo`)
        expect(body.scopes_supported).toEqual(expect.arrayContaining(['openid', 'email']))
        expect(body.claims_supported).toEqual(expect.arrayContaining(['email', 'email_verified']))
        expect(body.id_token_signing_alg_values_supported).toEqual(['RS256'])
        expect(body.response_types_supported).toEqual(['code'])
        expect(body.subject_types_supported).toEqual(['public'])
        expect(body.code_challenge_methods_supported).toEqual(['S256'])
    })

    it('advertises the openid and email scopes on the authorization server metadata', async () => {
        const res = await app.inject({ method: 'GET', url: '/.well-known/oauth-authorization-server' })

        expect(res.statusCode).toBe(200)
        expect(res.json().scopes_supported).toEqual(expect.arrayContaining(['mcp', 'openid', 'email']))
    })

    it('returns a verifiable id_token carrying the verified email and the request nonce', async () => {
        const nonce = 'n-0S6_WzA2Mj'
        const tokens = await completeFlow({ scope: 'openid email profile mcp', nonce })

        expect(tokens.id_token).toEqual(expect.any(String))

        const claims = await verifyIdToken(tokens.id_token as string)
        expect(claims.iss).toBe(await discoveredIssuer())
        expect(claims.aud).toBe(tokens.clientId)
        expect(claims.sub).toBe(ctx.user.id)
        expect(claims.email).toBe(ctx.userIdentity.email)
        expect(claims.email_verified).toBe(ctx.userIdentity.verified)
        expect(claims.nonce).toBe(nonce)
        expect(claims.name).toBe(`${ctx.userIdentity.firstName} ${ctx.userIdentity.lastName}`)
    })

    it('issues an id_token whose iss matches the issuer the client discovered on a custom domain', async () => {
        const headers = { 'x-forwarded-host': 'mcp.customer.example', 'x-forwarded-proto': 'https' }

        const resourceMetadata = await app.inject({
            method: 'GET',
            url: '/.well-known/oauth-protected-resource/mcp/platform',
            headers,
        })
        const [authorizationServer] = resourceMetadata.json().authorization_servers
        expect(authorizationServer).toBe('https://mcp.customer.example')
        expect(await discoveredIssuer(headers)).toBe(authorizationServer)

        const tokens = await completeFlow({ scope: 'openid email', headers })

        const claims = await verifyIdToken(tokens.id_token as string)
        expect(claims.iss).toBe(authorizationServer)
        expect(claims.email).toBe(ctx.userIdentity.email)
    })

    it('returns the verified email from the userinfo endpoint', async () => {
        const tokens = await completeFlow({ scope: 'openid email mcp' })

        const res = await app.inject({
            method: 'GET',
            url: '/userinfo',
            headers: { authorization: `Bearer ${tokens.access_token}` },
        })

        expect(res.statusCode).toBe(200)
        expect(res.json()).toEqual({
            sub: ctx.user.id,
            email: ctx.userIdentity.email,
            email_verified: ctx.userIdentity.verified,
        })
    })

    it('keeps serving the verified email from userinfo after a refresh', async () => {
        const tokens = await completeFlow({ scope: 'openid email mcp' })

        const refreshed = await app.inject({
            method: 'POST',
            url: '/token',
            payload: {
                grant_type: 'refresh_token',
                refresh_token: tokens.refresh_token,
                client_id: tokens.clientId,
            },
        })
        expect(refreshed.statusCode).toBe(200)

        const res = await app.inject({
            method: 'GET',
            url: '/userinfo',
            headers: { authorization: `Bearer ${refreshed.json().access_token}` },
        })

        expect(res.statusCode).toBe(200)
        expect(res.json().email).toBe(ctx.userIdentity.email)
        expect(res.json().email_verified).toBe(ctx.userIdentity.verified)
    })

    it('withholds the email and the id_token when openid was not granted', async () => {
        const tokens = await completeFlow({ scope: 'mcp' })
        expect(tokens.id_token).toBeUndefined()

        const res = await app.inject({
            method: 'GET',
            url: '/userinfo',
            headers: { authorization: `Bearer ${tokens.access_token}` },
        })

        expect(res.statusCode).toBe(200)
        expect(res.json()).toEqual({ sub: ctx.user.id })
    })

    it('rejects userinfo once the user behind the token is gone', async () => {
        const gone = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.ADMIN })
        const tokens = await completeFlow({ scope: 'openid email', ctx: gone })
        await databaseConnection().getRepository('user').delete({ id: gone.user.id })

        const res = await app.inject({
            method: 'GET',
            url: '/userinfo',
            headers: { authorization: `Bearer ${tokens.access_token}` },
        })

        expect(res.statusCode).toBe(401)
    })

    it('rejects userinfo without a bearer token', async () => {
        const res = await app.inject({ method: 'GET', url: '/userinfo' })

        expect(res.statusCode).toBe(401)
        expect(res.headers['www-authenticate']).toBe('Bearer')
    })

    it('rejects userinfo with a forged token', async () => {
        const forged = jwtLibrary.sign({ sub: ctx.user.id, type: 'mcp_oauth' }, 'not-the-server-secret')

        const res = await app.inject({
            method: 'GET',
            url: '/userinfo',
            headers: { authorization: `Bearer ${forged}` },
        })

        expect(res.statusCode).toBe(401)
        expect(res.headers['www-authenticate']).toBe('Bearer error="invalid_token"')
    })

    it('rejects userinfo after the grant is revoked', async () => {
        const tokens = await completeFlow({ scope: 'openid email mcp' })

        const revoked = await app.inject({
            method: 'POST',
            url: '/revoke',
            payload: { token: tokens.refresh_token, client_id: tokens.clientId },
        })
        expect(revoked.statusCode).toBe(200)

        const res = await app.inject({
            method: 'GET',
            url: '/userinfo',
            headers: { authorization: `Bearer ${tokens.access_token}` },
        })

        expect(res.statusCode).toBe(401)
    })
})

type IssuedTokens = {
    access_token: string
    refresh_token: string
    id_token?: string
}

type TokenResponse = IssuedTokens & {
    clientId: string
}
