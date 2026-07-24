import { createHash, randomBytes } from 'node:crypto'
import { apId } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { beforeAll, describe, expect, it } from 'vitest'
import { mcpOAuthCodeService } from '../../../../src/app/mcp/oauth/code/mcp-oauth-code.service'
import { setupTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

const REDIRECT_URI = 'https://example.com/oauth/callback'

async function registerClient(tokenEndpointAuthMethod?: string): Promise<RegisteredClient> {
    const body: Record<string, unknown> = { redirect_uris: [REDIRECT_URI] }
    if (tokenEndpointAuthMethod !== undefined) {
        body.token_endpoint_auth_method = tokenEndpointAuthMethod
    }
    const res = await app.inject({ method: 'POST', url: '/register', payload: body })
    return res.json()
}

async function seedAuthorizationCode(clientId: string, codeChallenge: string): Promise<string> {
    return mcpOAuthCodeService.create({
        clientId,
        userId: apId(),
        projectId: apId(),
        platformId: apId(),
        redirectUri: REDIRECT_URI,
        codeChallenge,
        codeChallengeMethod: 'S256',
        scopes: ['mcp'],
    })
}

function generatePkce(): { verifier: string, challenge: string } {
    const verifier = randomBytes(32).toString('base64url')
    const challenge = createHash('sha256').update(verifier).digest('base64url')
    return { verifier, challenge }
}

describe('MCP OAuth token endpoint', () => {
    beforeAll(async () => {
        app = await setupTestEnvironment({ fresh: true })
    })

    it('does not issue a client secret when token_endpoint_auth_method is omitted', async () => {
        const client = await registerClient()

        expect(client.token_endpoint_auth_method).toBe('none')
        expect(client.client_secret).toBeUndefined()
    })

    it('issues a client secret for a client_secret_basic registration', async () => {
        const client = await registerClient('client_secret_basic')

        expect(client.token_endpoint_auth_method).toBe('client_secret_basic')
        expect(typeof client.client_secret).toBe('string')
    })

    it('advertises client_secret_basic in the authorization server metadata', async () => {
        const res = await app.inject({ method: 'GET', url: '/.well-known/oauth-authorization-server' })

        expect(res.json().token_endpoint_auth_methods_supported).toContain('client_secret_basic')
    })

    it('exchanges an authorization code and sets no-store cache headers', async () => {
        const client = await registerClient('client_secret_post')
        const { verifier, challenge } = generatePkce()
        const code = await seedAuthorizationCode(client.client_id, challenge)

        const res = await app.inject({
            method: 'POST',
            url: '/token',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            payload: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                client_id: client.client_id,
                client_secret: client.client_secret ?? '',
                code_verifier: verifier,
                redirect_uri: REDIRECT_URI,
            }).toString(),
        })

        expect(res.statusCode).toBe(200)
        expect(res.json().access_token).toBeDefined()
        expect(res.headers['cache-control']).toBe('no-store')
        expect(res.headers['pragma']).toBe('no-cache')
    })

    it('authenticates a client_secret_basic client via the Authorization header', async () => {
        const client = await registerClient('client_secret_basic')
        const { verifier, challenge } = generatePkce()
        const code = await seedAuthorizationCode(client.client_id, challenge)
        const basicHeader = 'Basic ' + Buffer.from(`${client.client_id}:${client.client_secret}`).toString('base64')

        const res = await app.inject({
            method: 'POST',
            url: '/token',
            headers: { 'content-type': 'application/x-www-form-urlencoded', authorization: basicHeader },
            payload: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                code_verifier: verifier,
                redirect_uri: REDIRECT_URI,
            }).toString(),
        })

        expect(res.statusCode).toBe(200)
        expect(res.json().access_token).toBeDefined()
    })

    it('rejects a confidential client that presents no credentials', async () => {
        const client = await registerClient('client_secret_post')
        const { verifier, challenge } = generatePkce()
        const code = await seedAuthorizationCode(client.client_id, challenge)

        const res = await app.inject({
            method: 'POST',
            url: '/token',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            payload: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                client_id: client.client_id,
                code_verifier: verifier,
                redirect_uri: REDIRECT_URI,
            }).toString(),
        })

        expect(res.statusCode).toBe(400)
        expect(res.json().error).toBe('invalid_client')
    })

    it('falls back to body credentials when the Authorization header is malformed', async () => {
        const client = await registerClient('client_secret_post')
        const { verifier, challenge } = generatePkce()
        const code = await seedAuthorizationCode(client.client_id, challenge)
        const malformedHeader = 'Basic ' + Buffer.from('no-colon-here').toString('base64')

        const res = await app.inject({
            method: 'POST',
            url: '/token',
            headers: { 'content-type': 'application/x-www-form-urlencoded', authorization: malformedHeader },
            payload: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                client_id: client.client_id,
                client_secret: client.client_secret ?? '',
                code_verifier: verifier,
                redirect_uri: REDIRECT_URI,
            }).toString(),
        })

        expect(res.statusCode).toBe(200)
        expect(res.json().access_token).toBeDefined()
    })

    it('rejects a client_secret_basic client presenting a wrong secret', async () => {
        const client = await registerClient('client_secret_basic')
        const { verifier, challenge } = generatePkce()
        const code = await seedAuthorizationCode(client.client_id, challenge)
        const basicHeader = 'Basic ' + Buffer.from(`${client.client_id}:wrong-secret`).toString('base64')

        const res = await app.inject({
            method: 'POST',
            url: '/token',
            headers: { 'content-type': 'application/x-www-form-urlencoded', authorization: basicHeader },
            payload: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                code_verifier: verifier,
                redirect_uri: REDIRECT_URI,
            }).toString(),
        })

        expect(res.statusCode).toBe(400)
        expect(res.json().error).toBe('invalid_client')
    })

    it('exchanges an authorization code for a public (none) client without a secret', async () => {
        const client = await registerClient('none')
        expect(client.client_secret).toBeUndefined()
        const { verifier, challenge } = generatePkce()
        const code = await seedAuthorizationCode(client.client_id, challenge)

        const res = await app.inject({
            method: 'POST',
            url: '/token',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            payload: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                client_id: client.client_id,
                code_verifier: verifier,
                redirect_uri: REDIRECT_URI,
            }).toString(),
        })

        expect(res.statusCode).toBe(200)
        expect(res.json().access_token).toBeDefined()
    })

    it('authenticates a client_secret_basic client on the revoke endpoint via the Authorization header', async () => {
        const client = await registerClient('client_secret_basic')
        const basicHeader = 'Basic ' + Buffer.from(`${client.client_id}:${client.client_secret}`).toString('base64')

        const res = await app.inject({
            method: 'POST',
            url: '/revoke',
            headers: { 'content-type': 'application/x-www-form-urlencoded', authorization: basicHeader },
            payload: new URLSearchParams({ token: 'some-refresh-token' }).toString(),
        })

        expect(res.statusCode).toBe(200)
    })

    it('rejects a revoke from a client_secret_basic client presenting a wrong secret', async () => {
        const client = await registerClient('client_secret_basic')
        const basicHeader = 'Basic ' + Buffer.from(`${client.client_id}:wrong-secret`).toString('base64')

        const res = await app.inject({
            method: 'POST',
            url: '/revoke',
            headers: { 'content-type': 'application/x-www-form-urlencoded', authorization: basicHeader },
            payload: new URLSearchParams({ token: 'some-refresh-token' }).toString(),
        })

        expect(res.statusCode).toBe(400)
        expect(res.json().error).toBe('invalid_client')
    })
})

type RegisteredClient = {
    client_id: string
    client_secret?: string
    token_endpoint_auth_method: string
}
