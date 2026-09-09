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

        it('sends the consent redirect to the hostname root, the only path the app can route', async () => {
            const client = await mcpOAuthTestHelpers.registerClient({ app, tokenEndpointAuthMethod: 'none' })
            const { challenge } = mcpOAuthTestHelpers.generatePkce()

            const res = await app.inject({
                method: 'GET',
                headers: { 'x-forwarded-proto': 'https', 'x-forwarded-host': 'apps.customer.example.com' },
                url: `/authorize?client_id=${client.client_id}&redirect_uri=${encodeURIComponent(MCP_OAUTH_REDIRECT_URI)}&response_type=code&code_challenge=${challenge}&code_challenge_method=S256`,
            })

            expect(res.statusCode).toBe(302)
            expect(res.headers.location).toMatch(/^https:\/\/apps\.customer\.example\.com\/mcp-authorize\?/)
        })
    })
    describe('with MCP served from its own hostname', () => {
        const DUAL_FRONTEND_URL = 'https://apps.customer.example.com/automation'
        const DUAL_MCP_URL = 'https://mcp.customer.example.com'
        const mcpHostHeaders = { 'x-forwarded-proto': 'https', 'x-forwarded-host': 'mcp.customer.example.com' }
        const frontendHostHeaders = { 'x-forwarded-proto': 'https', 'x-forwarded-host': 'apps.customer.example.com' }

        beforeAll(() => {
            const realGet = system.get.bind(system)
            const realGetOrThrow = system.getOrThrow.bind(system)
            vi.spyOn(system, 'get').mockImplementation((prop) => {
                if (prop === AppSystemProp.MCP_URL) {
                    return DUAL_MCP_URL
                }
                if (prop === AppSystemProp.FRONTEND_URL) {
                    return DUAL_FRONTEND_URL
                }
                return realGet(prop)
            })
            vi.spyOn(system, 'getOrThrow').mockImplementation((prop) => prop === AppSystemProp.FRONTEND_URL ? DUAL_FRONTEND_URL : realGetOrThrow(prop))
        })

        it('advertises the MCP host without the frontend path prefix', async () => {
            const metadata = await discovery(mcpHostHeaders)

            expect(metadata.issuer).toBe(DUAL_MCP_URL)
            expect(metadata.token_endpoint).toBe(`${DUAL_MCP_URL}/token`)
            expect(metadata.registration_endpoint).toBe(`${DUAL_MCP_URL}/register`)
        })

        it('keeps advertising the prefixed frontend base on the frontend host', async () => {
            const metadata = await discovery(frontendHostHeaders)

            expect(metadata.issuer).toBe(DUAL_FRONTEND_URL)
            expect(metadata.token_endpoint).toBe(`${DUAL_FRONTEND_URL}/token`)
        })

        it('points protected resource metadata at the MCP host', async () => {
            const res = await app.inject({
                method: 'GET',
                url: '/.well-known/oauth-protected-resource/mcp',
                headers: mcpHostHeaders,
            })

            expect(res.json().resource).toBe(`${DUAL_MCP_URL}/mcp`)
            expect(res.json().authorization_servers).toEqual([DUAL_MCP_URL])
        })

        it('challenges an unauthenticated MCP call on the MCP host with its own metadata URL', async () => {
            const res = await app.inject({ method: 'POST', url: '/mcp', headers: mcpHostHeaders })

            expect(res.statusCode).toBe(401)
            expect(res.headers['www-authenticate']).toContain(`${DUAL_MCP_URL}/.well-known/oauth-protected-resource/mcp`)
        })

        it('sends consent to the frontend origin, so the user signs in on the main host', async () => {
            const client = await mcpOAuthTestHelpers.registerClient({ app, tokenEndpointAuthMethod: 'none' })
            const { challenge } = mcpOAuthTestHelpers.generatePkce()

            const res = await app.inject({
                method: 'GET',
                headers: mcpHostHeaders,
                url: `/authorize?client_id=${client.client_id}&redirect_uri=${encodeURIComponent(MCP_OAUTH_REDIRECT_URI)}&response_type=code&code_challenge=${challenge}&code_challenge_method=S256`,
            })

            expect(res.statusCode).toBe(302)
            expect(res.headers.location).toMatch(/^https:\/\/apps\.customer\.example\.com\/mcp-authorize\?/)
        })

        it('leaves consent on the request host for a host matching neither setting', async () => {
            const client = await mcpOAuthTestHelpers.registerClient({ app, tokenEndpointAuthMethod: 'none' })
            const { challenge } = mcpOAuthTestHelpers.generatePkce()

            const res = await app.inject({
                method: 'GET',
                headers: { 'x-forwarded-proto': 'https', 'x-forwarded-host': 'byo.customer.example.com' },
                url: `/authorize?client_id=${client.client_id}&redirect_uri=${encodeURIComponent(MCP_OAUTH_REDIRECT_URI)}&response_type=code&code_challenge=${challenge}&code_challenge_method=S256`,
            })

            expect(res.statusCode).toBe(302)
            expect(res.headers.location).toMatch(/^https:\/\/byo\.customer\.example\.com\/mcp-authorize\?/)
        })
    })

    describe('with AP_MCP_URL sharing the frontend hostname', () => {
        const SHARED_FRONTEND_URL = 'https://apps.customer.example.com/automation'
        const SHARED_MCP_URL = 'https://apps.customer.example.com'
        const sharedHostHeaders = { 'x-forwarded-proto': 'https', 'x-forwarded-host': 'apps.customer.example.com' }

        beforeAll(() => {
            const realGet = system.get.bind(system)
            const realGetOrThrow = system.getOrThrow.bind(system)
            vi.spyOn(system, 'get').mockImplementation((prop) => {
                if (prop === AppSystemProp.MCP_URL) {
                    return SHARED_MCP_URL
                }
                if (prop === AppSystemProp.FRONTEND_URL) {
                    return SHARED_FRONTEND_URL
                }
                return realGet(prop)
            })
            vi.spyOn(system, 'getOrThrow').mockImplementation((prop) => prop === AppSystemProp.FRONTEND_URL ? SHARED_FRONTEND_URL : realGetOrThrow(prop))
        })

        it('serves MCP at the host root while the app keeps its prefix', async () => {
            const metadata = await discovery(sharedHostHeaders)

            expect(metadata.issuer).toBe(SHARED_MCP_URL)
            expect(metadata.authorization_endpoint).toBe(`${SHARED_MCP_URL}/authorize`)
            expect(metadata.token_endpoint).toBe(`${SHARED_MCP_URL}/token`)
        })

        it('gives a client pointed at the host-root /mcp a resource identifier that matches', async () => {
            const res = await app.inject({
                method: 'GET',
                url: '/.well-known/oauth-protected-resource/mcp',
                headers: sharedHostHeaders,
            })

            expect(res.json().resource).toBe(`${SHARED_MCP_URL}/mcp`)
            expect(res.json().authorization_servers).toEqual([SHARED_MCP_URL])
        })

        it('sends consent to the frontend origin, without the configured prefix', async () => {
            const client = await mcpOAuthTestHelpers.registerClient({ app, tokenEndpointAuthMethod: 'none' })
            const { challenge } = mcpOAuthTestHelpers.generatePkce()

            const res = await app.inject({
                method: 'GET',
                headers: sharedHostHeaders,
                url: `/authorize?client_id=${client.client_id}&redirect_uri=${encodeURIComponent(MCP_OAUTH_REDIRECT_URI)}&response_type=code&code_challenge=${challenge}&code_challenge_method=S256`,
            })

            expect(res.statusCode).toBe(302)
            expect(res.headers.location).toMatch(/^https:\/\/apps\.customer\.example\.com\/mcp-authorize\?/)
        })
    })
})
