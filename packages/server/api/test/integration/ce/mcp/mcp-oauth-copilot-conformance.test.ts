import { createHash, randomBytes } from 'node:crypto'
import { FastifyInstance } from 'fastify'
import { beforeAll, describe, expect, it } from 'vitest'
import { setupTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
let base: string

const REDIRECT_URI = 'https://token.botframework.com/.auth/web/redirect'

async function get(path: string): Promise<{ status: number, body: Record<string, unknown> }> {
    const res = await fetch(`${base}${path}`)
    return { status: res.status, body: await res.json() as Record<string, unknown> }
}

describe('Microsoft Copilot Studio DCR prerequisites', () => {
    beforeAll(async () => {
        app = await setupTestEnvironment({ fresh: true })
        await app.listen({ port: 0, host: '127.0.0.1' })
        const address = app.server.address()
        base = `http://127.0.0.1:${typeof address === 'object' && address !== null ? address.port : 0}`
    })

    it('exposes protected resource metadata identifying its authorization server (RFC 9728)', async () => {
        const { status, body } = await get('/.well-known/oauth-protected-resource/mcp')

        expect(status).toBe(200)
        expect(body.resource).toEqual(expect.stringContaining('/mcp'))
        expect(body.authorization_servers).toEqual(expect.arrayContaining([expect.any(String)]))
    })

    it('points an unauthenticated MCP caller at that metadata via WWW-Authenticate', async () => {
        const res = await fetch(`${base}/mcp`, { method: 'POST' })

        expect(res.status).toBe(401)
        expect(res.headers.get('www-authenticate')).toEqual(expect.stringContaining('resource_metadata='))
    })

    it('publishes authorization server metadata including a registration_endpoint (RFC 8414)', async () => {
        const { status, body } = await get('/.well-known/oauth-authorization-server')

        expect(status).toBe(200)
        expect(body.registration_endpoint).toEqual(expect.stringContaining('/register'))
        expect(body.token_endpoint).toEqual(expect.stringContaining('/token'))
        expect(body.authorization_endpoint).toEqual(expect.stringContaining('/authorize'))
    })

    it('advertises S256, which Copilot enables by default for DCR', async () => {
        const { body } = await get('/.well-known/oauth-authorization-server')

        expect(body.code_challenge_methods_supported).toEqual(['S256'])
    })

    it('issues a client secret during registration, which Copilot requires', async () => {
        const res = await fetch(`${base}/register`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ redirect_uris: [REDIRECT_URI], client_name: 'Copilot Studio' }),
        })
        const client = await res.json() as Record<string, string>

        expect(res.status).toBe(201)
        expect(client.client_secret).toEqual(expect.any(String))
        expect(client.token_endpoint_auth_method).toBe('client_secret_basic')
    })

    it('completes the authorize step Copilot performs, redirecting to consent', async () => {
        const registered = await fetch(`${base}/register`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ redirect_uris: [REDIRECT_URI] }),
        })
        const client = await registered.json() as Record<string, string>
        const verifier = randomBytes(32).toString('base64url')
        const challenge = createHash('sha256').update(verifier).digest('base64url')

        const params = new URLSearchParams({
            client_id: client.client_id,
            redirect_uri: REDIRECT_URI,
            response_type: 'code',
            code_challenge: challenge,
            code_challenge_method: 'S256',
            scope: 'mcp',
            state: 'copilot-state',
        })
        const res = await fetch(`${base}/authorize?${params.toString()}`, { redirect: 'manual' })

        expect(res.status).toBe(302)
        expect(res.headers.get('location')).toEqual(expect.stringContaining('/mcp-authorize?authRequestId='))
    })

    it('accepts the issued secret over the Authorization header at the token endpoint', async () => {
        const registered = await fetch(`${base}/register`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ redirect_uris: [REDIRECT_URI] }),
        })
        const client = await registered.json() as Record<string, string>
        const authorization = 'Basic ' + Buffer.from(`${client.client_id}:${client.client_secret}`).toString('base64')

        const res = await fetch(`${base}/token`, {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded', authorization },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: 'a-code-that-was-never-issued',
                code_verifier: randomBytes(32).toString('base64url'),
                redirect_uri: REDIRECT_URI,
            }).toString(),
        })
        const body = await res.json() as Record<string, string>

        expect(res.status).toBe(400)
        expect(body.error).toBe('invalid_grant')
        expect(res.headers.get('cache-control')).toBe('no-store')
    })

    it('rejects the issued secret when it is wrong, over the same header', async () => {
        const registered = await fetch(`${base}/register`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ redirect_uris: [REDIRECT_URI] }),
        })
        const client = await registered.json() as Record<string, string>
        const authorization = 'Basic ' + Buffer.from(`${client.client_id}:not-the-secret`).toString('base64')

        const res = await fetch(`${base}/token`, {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded', authorization },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: 'a-code-that-was-never-issued',
                code_verifier: randomBytes(32).toString('base64url'),
                redirect_uri: REDIRECT_URI,
            }).toString(),
        })

        expect(res.status).toBe(400)
        expect((await res.json() as Record<string, string>).error).toBe('invalid_client')
    })

    it.each([
        ['Power Platform connector consent', 'https://global.consent.azure-apim.net/redirect'],
        ['regional connector consent', 'https://europe-002.consent.azure-apim.net/redirect'],
        ['Bot Framework token store', 'https://token.botframework.com/.auth/web/redirect'],
        ['Microsoft native client', 'https://login.microsoftonline.com/common/oauth2/nativeclient'],
    ])('accepts the %s callback as a redirect URI', async (_name, redirectUri) => {
        const res = await fetch(`${base}/register`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ redirect_uris: [redirectUri] }),
        })

        expect(res.status).toBe(201)
        expect((await res.json() as Record<string, string>).client_secret).toEqual(expect.any(String))
    })

    it('ignores the optional RFC 7591 metadata a strict client sends rather than rejecting the registration', async () => {
        const res = await fetch(`${base}/register`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                redirect_uris: [REDIRECT_URI],
                client_name: 'Copilot Studio Agent',
                grant_types: ['authorization_code', 'refresh_token'],
                response_types: ['code'],
                scope: 'mcp offline_access',
                client_uri: 'https://copilotstudio.microsoft.com',
                logo_uri: 'https://copilotstudio.microsoft.com/logo.png',
                tos_uri: 'https://microsoft.com/tos',
                policy_uri: 'https://microsoft.com/privacy',
                contacts: ['admin@contoso.com'],
                software_id: 'copilot-studio',
                software_version: '1.0.0',
                application_type: 'web',
                jwks_uri: 'https://example.com/jwks',
            }),
        })
        const client = await res.json() as Record<string, string>

        expect(res.status).toBe(201)
        expect(client.client_secret).toEqual(expect.any(String))
        expect(client.token_endpoint_auth_method).toBe('client_secret_basic')
    })
})
