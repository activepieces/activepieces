import { FastifyInstance } from 'fastify'
import { beforeAll, describe, expect, it } from 'vitest'
import { MCP_OAUTH_REDIRECT_URI, mcpOAuthTestHelpers } from '../../../helpers/mcp-oauth'
import { setupTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
const R = MCP_OAUTH_REDIRECT_URI

const HOSTILE = [
    '\u0000', 'a\u0000b', '\u0000a', 'a\u0000', '\u007F', '\u001B', '\n', '\t',
    'a'.repeat(5000), '\'--', '%00', '\uD800', 'a\uDC00b', 'not a url', 'http://', '://x', 'javascript:alert(1)',
]

async function newClient(): Promise<{ client_id: string }> {
    return mcpOAuthTestHelpers.registerClient({ app, tokenEndpointAuthMethod: 'none' })
}

function assertClean({ label, res }: { label: string, res: { statusCode: number, body: string } }): void {
    expect(res.statusCode, label).toBeLessThan(500)
    expect(res.body, label).not.toContain('22021')
    expect(res.body, label).not.toContain('invalid byte sequence')
    expect(res.body, label).not.toContain('ERR_INVALID_URL')
}

describe('MCP OAuth input hardening', () => {
    beforeAll(async () => {
        app = await setupTestEnvironment({ fresh: true })
    })

    it('never returns 5xx or leaks driver detail from any /register field', async () => {
        for (const v of HOSTILE) {
            for (const payload of [
                { redirect_uris: [v] },
                { redirect_uris: [R, v] },
                { redirect_uris: [R], client_name: v },
                { redirect_uris: [R], grant_types: [v] },
                { redirect_uris: [R], response_types: [v] },
                { redirect_uris: [R], token_endpoint_auth_method: v },
            ]) {
                const res = await app.inject({ method: 'POST', url: '/register', payload })
                assertClean({ label: `register ${JSON.stringify(payload).slice(0, 80)}`, res })
            }
        }
    })

    it('never returns 5xx or leaks driver detail from any /token field', async () => {
        const client = await newClient()
        for (const v of HOSTILE) {
            for (const field of ['code', 'client_id', 'client_secret', 'code_verifier', 'redirect_uri', 'refresh_token', 'resource', 'grant_type']) {
                for (const grant of ['authorization_code', 'refresh_token']) {
                    const body: Record<string, string> = {
                        grant_type: grant, code: 'abc', client_id: client.client_id,
                        code_verifier: 'v', redirect_uri: R, refresh_token: 'rt',
                    }
                    body[field] = v
                    const res = await app.inject({
                        method: 'POST', url: '/token',
                        headers: { 'content-type': 'application/x-www-form-urlencoded' },
                        payload: new URLSearchParams(body).toString(),
                    })
                    assertClean({ label: `token ${field}`, res })
                }
            }
        }
    })

    it('never returns 5xx or leaks driver detail from any /revoke field or the Basic header', async () => {
        for (const v of HOSTILE) {
            for (const field of ['token', 'client_id', 'client_secret', 'token_type_hint']) {
                const body: Record<string, string> = { token: 'abc' }
                body[field] = v
                const res = await app.inject({
                    method: 'POST', url: '/revoke',
                    headers: { 'content-type': 'application/x-www-form-urlencoded' },
                    payload: new URLSearchParams(body).toString(),
                })
                assertClean({ label: `revoke ${field}`, res })
            }
            const viaHeader = await app.inject({
                method: 'POST', url: '/revoke',
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    authorization: 'Basic ' + Buffer.from(`${v}:${v}`).toString('base64'),
                },
                payload: 'token=abc',
            })
            assertClean({ label: 'revoke basic', res: viaHeader })
        }
    })

    it('never returns 5xx or leaks driver detail from any /authorize query param', async () => {
        const client = await newClient()
        for (const v of HOSTILE) {
            for (const field of ['client_id', 'redirect_uri', 'response_type', 'code_challenge', 'code_challenge_method', 'state', 'scope', 'resource']) {
                const params: Record<string, string> = {
                    client_id: client.client_id, redirect_uri: R, response_type: 'code',
                    code_challenge: 'a'.repeat(43), code_challenge_method: 'S256',
                }
                params[field] = v
                const res = await app.inject({ method: 'GET', url: `/authorize?${new URLSearchParams(params).toString()}` })
                assertClean({ label: `authorize ${field}`, res })
            }
        }
    })

    it.each([
        ['space in host', { 'x-forwarded-host': 'a b' }],
        ['brackets in host', { 'x-forwarded-host': '[oops]' }],
        ['control character in host', { 'x-forwarded-host': 'a\u0000b' }],
        ['percent junk in host', { 'x-forwarded-host': '%%%' }],
        ['space in proto', { 'x-forwarded-proto': 'a b' }],
        ['empty proto', { 'x-forwarded-proto': '' }],
        ['bogus proto', { 'x-forwarded-proto': 'ht#tp' }],
        ['port above the valid range', { 'x-forwarded-host': 'evil.com:99999' }],
        ['first out-of-range port', { 'x-forwarded-host': 'evil.com:65536' }],
        ['out-of-range port in a forwarded chain', { 'x-forwarded-host': 'evil.com:99999, real.com' }],
        ['truncated IPv6 literal', { 'x-forwarded-host': '[::1' }],
        ['credentials in host', { 'x-forwarded-host': 'user:pass@evil.com' }],
        ['path injected into host', { 'x-forwarded-host': 'evil.com/x' }],
    ])('never lets a malformed forwarding header reach URL construction (%s)', async (_name, headers) => {
        const client = await newClient()

        const authorize = await app.inject({
            method: 'GET',
            url: `/authorize?client_id=${client.client_id}&redirect_uri=${encodeURIComponent(R)}&response_type=code&code_challenge=${'a'.repeat(43)}&code_challenge_method=S256`,
            headers,
        })
        assertClean({ label: 'authorize forwarded header', res: authorize })

        const metadata = await app.inject({ method: 'GET', url: '/.well-known/oauth-authorization-server', headers })
        assertClean({ label: 'metadata forwarded header', res: metadata })
        expect(metadata.json().issuer).toMatch(/^https?:\/\//)
    })

    it.each([
        ['plain custom domain', 'customer.example.com'],
        ['custom domain with port', 'customer.example.com:8080'],
        ['default https port', 'customer.example.com:443'],
        ['max valid port', 'customer.example.com:65535'],
        ['ipv6 literal', '[::1]:8080'],
    ])('still reflects a well-formed forwarded host so custom domains keep working (%s)', async (_name, host) => {
        const res = await app.inject({
            method: 'GET',
            url: '/.well-known/oauth-authorization-server',
            headers: { 'x-forwarded-host': host, 'x-forwarded-proto': 'https' },
        })

        expect(res.json().issuer).toBe(`https://${host}`)
    })

    it.each([
        ['space in Host', 'a b.com'],
        ['percent in Host', 'ex%ample.com'],
        ['pipe in Host', 'a|b.com'],
        ['angle bracket in Host', 'a<b.com'],
        ['quote in Host', 'ev"il.com'],
        ['backslash in Host', 'a\\b.com'],
        ['truncated IPv6 Host', '[foo'],
        ['empty Host', ''],
    ])('never lets a malformed Host header reach URL construction or a header value (%s)', async (_name, host) => {
        const client = await newClient()

        const authorize = await app.inject({
            method: 'GET',
            url: `/authorize?client_id=${client.client_id}&redirect_uri=${encodeURIComponent(R)}&response_type=code&code_challenge=${'a'.repeat(43)}&code_challenge_method=S256`,
            headers: { host },
        })
        assertClean({ label: 'authorize Host header', res: authorize })

        const metadata = await app.inject({ method: 'GET', url: '/.well-known/oauth-authorization-server', headers: { host } })
        assertClean({ label: 'metadata Host header', res: metadata })
        expect(metadata.json().issuer).toMatch(/^https?:\/\/[A-Za-z0-9._\-:[\]]+$/)

        const unauthorized = await app.inject({ method: 'POST', url: '/mcp', headers: { host } })
        const challenge = String(unauthorized.headers['www-authenticate'] ?? '')
        expect((challenge.match(/"/g) ?? []).length % 2, challenge).toBe(0)
    })
})
