import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGet = vi.fn()
const mockPost = vi.fn()

vi.mock('@activepieces/server-utils', () => ({
    safeHttp: {
        axios: {
            get: (...args: unknown[]) => mockGet(...args),
            post: (...args: unknown[]) => mockPost(...args),
        },
    },
}))

import { oauth2Discovery } from '../../../../src/app/app-connection/app-connection-service/oauth2/oauth2-discovery'

const SERVER_URL = 'https://mcp.example.com/mcp'
const REDIRECT_URL = 'https://cloud.activepieces.com/redirect'

const AUTHORIZATION_SERVER_METADATA = {
    authorization_endpoint: 'https://as.example.com/authorize',
    token_endpoint: 'https://as.example.com/token',
    registration_endpoint: 'https://as.example.com/register',
    scopes_supported: ['openid', 'profile'],
}

function serve(documents: Record<string, unknown>): void {
    mockGet.mockImplementation(async (url: string) => {
        if (url in documents) {
            return { data: documents[url] }
        }
        throw new Error(`not found: ${url}`)
    })
}

function registers(client: Record<string, unknown>): void {
    mockPost.mockResolvedValue({ data: client })
}

describe('oauth2Discovery.discoverAndRegister', () => {
    beforeEach(() => {
        mockGet.mockReset()
        mockPost.mockReset()
        registers({ client_id: 'cid', client_secret: 'secret' })
    })

    it('walks protected-resource metadata to the authorization server and registers a client', async () => {
        serve({
            'https://mcp.example.com/.well-known/oauth-protected-resource/mcp': { authorization_servers: ['https://as.example.com/'] },
            'https://as.example.com/.well-known/oauth-authorization-server': AUTHORIZATION_SERVER_METADATA,
        })

        const result = await oauth2Discovery.discoverAndRegister({ serverUrl: SERVER_URL, redirectUrl: REDIRECT_URL })

        expect(result.tokenUrl).toBe('https://as.example.com/token')
        expect(result.scopes).toBe('openid profile')
        expect(result.clientId).toBe('cid')
        expect(result.clientSecret).toBe('secret')

        const [registrationEndpoint, body] = mockPost.mock.calls[0]
        expect(registrationEndpoint).toBe('https://as.example.com/register')
        expect(body).toMatchObject({
            redirect_uris: [REDIRECT_URL],
            token_endpoint_auth_method: 'client_secret_basic',
        })
    })

    it('sends the MCP server as the resource indicator on the authorize url', async () => {
        serve({
            'https://mcp.example.com/.well-known/oauth-protected-resource/mcp': { authorization_servers: ['https://as.example.com/'] },
            'https://as.example.com/.well-known/oauth-authorization-server': AUTHORIZATION_SERVER_METADATA,
        })

        const result = await oauth2Discovery.discoverAndRegister({ serverUrl: SERVER_URL, redirectUrl: REDIRECT_URL })

        expect(new URL(result.authUrl).searchParams.get('resource')).toBe(SERVER_URL)
    })

    it('falls back to openid-configuration when the rfc 8414 document is absent', async () => {
        serve({
            'https://mcp.example.com/.well-known/oauth-protected-resource/mcp': { authorization_servers: ['https://as.example.com/'] },
            'https://as.example.com/.well-known/openid-configuration': AUTHORIZATION_SERVER_METADATA,
        })

        const result = await oauth2Discovery.discoverAndRegister({ serverUrl: SERVER_URL, redirectUrl: REDIRECT_URL })

        expect(result.tokenUrl).toBe('https://as.example.com/token')
    })

    it('inserts the rfc 8414 well-known suffix before the issuer path, not after (Okta/Keycloak-shaped issuers)', async () => {
        serve({
            'https://mcp.example.com/.well-known/oauth-protected-resource/mcp': { authorization_servers: ['https://as.example.com/realms/demo'] },
            'https://as.example.com/.well-known/oauth-authorization-server/realms/demo': AUTHORIZATION_SERVER_METADATA,
        })

        const result = await oauth2Discovery.discoverAndRegister({ serverUrl: SERVER_URL, redirectUrl: REDIRECT_URL })

        expect(result.tokenUrl).toBe('https://as.example.com/token')
    })

    it('appends the openid-configuration well-known suffix after the issuer path', async () => {
        serve({
            'https://mcp.example.com/.well-known/oauth-protected-resource/mcp': { authorization_servers: ['https://as.example.com/realms/demo'] },
            'https://as.example.com/realms/demo/.well-known/openid-configuration': AUTHORIZATION_SERVER_METADATA,
        })

        const result = await oauth2Discovery.discoverAndRegister({ serverUrl: SERVER_URL, redirectUrl: REDIRECT_URL })

        expect(result.tokenUrl).toBe('https://as.example.com/token')
    })

    it('treats the server as its own authorization server when it publishes no protected-resource document', async () => {
        serve({
            'https://mcp.example.com/.well-known/oauth-authorization-server': AUTHORIZATION_SERVER_METADATA,
        })

        const result = await oauth2Discovery.discoverAndRegister({ serverUrl: SERVER_URL, redirectUrl: REDIRECT_URL })

        expect(result.tokenUrl).toBe('https://as.example.com/token')
    })

    it('rejects a server that does not support dynamic client registration', async () => {
        serve({
            'https://mcp.example.com/.well-known/oauth-protected-resource/mcp': { authorization_servers: ['https://as.example.com/'] },
            'https://as.example.com/.well-known/oauth-authorization-server': { ...AUTHORIZATION_SERVER_METADATA, registration_endpoint: undefined },
        })

        await expect(oauth2Discovery.discoverAndRegister({ serverUrl: SERVER_URL, redirectUrl: REDIRECT_URL }))
            .rejects.toMatchObject({ error: { params: { error: expect.stringContaining('Dynamic Client Registration') } } })
    })

    it('rejects a public client, which the token exchange cannot authenticate', async () => {
        serve({
            'https://mcp.example.com/.well-known/oauth-protected-resource/mcp': { authorization_servers: ['https://as.example.com/'] },
            'https://as.example.com/.well-known/oauth-authorization-server': AUTHORIZATION_SERVER_METADATA,
        })
        registers({ client_id: 'cid' })

        await expect(oauth2Discovery.discoverAndRegister({ serverUrl: SERVER_URL, redirectUrl: REDIRECT_URL }))
            .rejects.toMatchObject({ error: { params: { error: expect.stringContaining('public OAuth2 clients') } } })
    })

    it('reports discovery failure when no metadata can be reached', async () => {
        serve({})

        await expect(oauth2Discovery.discoverAndRegister({ serverUrl: SERVER_URL, redirectUrl: REDIRECT_URL }))
            .rejects.toMatchObject({ error: { params: { error: expect.stringContaining('AP_SSRF_ALLOW_LIST') } } })
    })
})
