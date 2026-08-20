import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { system } from '../../../../src/app/helper/system/system'
import { AppSystemProp } from '../../../../src/app/helper/system/system-props'
import { MCP_OAUTH_REDIRECT_URI, mcpOAuthTestHelpers } from '../../../helpers/mcp-oauth'
import { setupTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

const TLS_PROXY_HEADERS = {
    'x-forwarded-proto': 'https',
    'x-forwarded-host': 'mcp.customer.example.com',
}

async function discovery(headers: Record<string, string>): Promise<Record<string, string>> {
    const res = await app.inject({ method: 'GET', url: '/.well-known/oauth-authorization-server', headers })
    return res.json()
}

describe('MCP OAuth deployment shapes', () => {
    beforeAll(async () => {
        app = await setupTestEnvironment({ fresh: true })
    })

    afterAll(() => {
        vi.restoreAllMocks()
    })

    describe('behind a TLS-terminating proxy', () => {
        it('advertises https endpoints on the customer host, never the internal one', async () => {
            const metadata = await discovery(TLS_PROXY_HEADERS)

            for (const field of ['issuer', 'authorization_endpoint', 'token_endpoint', 'registration_endpoint', 'revocation_endpoint']) {
                expect(metadata[field], field).toMatch(/^https:\/\/mcp\.customer\.example\.com/)
            }
        })

        it('sends the consent redirect to the customer host so the browser can reach it', async () => {
            const client = await mcpOAuthTestHelpers.registerClient({ app, tokenEndpointAuthMethod: 'none' })
            const { challenge } = mcpOAuthTestHelpers.generatePkce()

            const res = await app.inject({
                method: 'GET',
                headers: TLS_PROXY_HEADERS,
                url: `/authorize?client_id=${client.client_id}&redirect_uri=${encodeURIComponent(MCP_OAUTH_REDIRECT_URI)}&response_type=code&code_challenge=${challenge}&code_challenge_method=S256`,
            })

            expect(res.statusCode).toBe(302)
            expect(res.headers.location).toMatch(/^https:\/\/mcp\.customer\.example\.com\/mcp-authorize\?/)
        })

        it('points the protected resource metadata at the customer host', async () => {
            const res = await app.inject({
                method: 'GET',
                url: '/.well-known/oauth-protected-resource/mcp',
                headers: TLS_PROXY_HEADERS,
            })

            expect(res.json().resource).toBe('https://mcp.customer.example.com/mcp')
            expect(res.json().authorization_servers).toEqual(['https://mcp.customer.example.com'])
        })

        it('challenges an unauthenticated MCP call with a reachable metadata URL', async () => {
            const res = await app.inject({ method: 'POST', url: '/mcp', headers: TLS_PROXY_HEADERS })

            expect(res.statusCode).toBe(401)
            expect(res.headers['www-authenticate']).toContain('https://mcp.customer.example.com/.well-known/oauth-protected-resource/mcp')
        })
    })

    describe('hosted under a path prefix', () => {
        const PREFIXED_FRONTEND_URL = 'https://apps.customer.example.com/automation'

        beforeAll(() => {
            const realGet = system.get.bind(system)
            const realGetOrThrow = system.getOrThrow.bind(system)
            vi.spyOn(system, 'get').mockImplementation((prop) => prop === AppSystemProp.FRONTEND_URL ? PREFIXED_FRONTEND_URL : realGet(prop))
            vi.spyOn(system, 'getOrThrow').mockImplementation((prop) => prop === AppSystemProp.FRONTEND_URL ? PREFIXED_FRONTEND_URL : realGetOrThrow(prop))
        })

        it('advertises every endpoint under the configured prefix', async () => {
            const metadata = await discovery({ 'x-forwarded-proto': 'https', 'x-forwarded-host': 'apps.customer.example.com' })

            expect(metadata.issuer).toBe('https://apps.customer.example.com/automation')
            expect(metadata.token_endpoint).toBe('https://apps.customer.example.com/automation/token')
            expect(metadata.registration_endpoint).toBe('https://apps.customer.example.com/automation/register')
        })

        it('sends the consent redirect under the prefix', async () => {
            const client = await mcpOAuthTestHelpers.registerClient({ app, tokenEndpointAuthMethod: 'none' })
            const { challenge } = mcpOAuthTestHelpers.generatePkce()

            const res = await app.inject({
                method: 'GET',
                headers: { 'x-forwarded-proto': 'https', 'x-forwarded-host': 'apps.customer.example.com' },
                url: `/authorize?client_id=${client.client_id}&redirect_uri=${encodeURIComponent(MCP_OAUTH_REDIRECT_URI)}&response_type=code&code_challenge=${challenge}&code_challenge_method=S256`,
            })

            expect(res.statusCode).toBe(302)
            expect(res.headers.location).toMatch(/^https:\/\/apps\.customer\.example\.com\/automation\/mcp-authorize\?/)
        })
    })
})
