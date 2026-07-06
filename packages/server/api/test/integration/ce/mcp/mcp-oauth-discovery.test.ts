import { FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { system } from '../../../../src/app/helper/system/system'
import { AppSystemProp } from '../../../../src/app/helper/system/system-props'
import { setupTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
const DEFAULT_FRONTEND_URL = 'https://example.com/activepieces'
let frontendUrl = DEFAULT_FRONTEND_URL

const subpathHeaders = {
    'x-forwarded-host': 'example.com',
    'x-forwarded-proto': 'https',
}

describe('MCP OAuth discovery', () => {
    beforeAll(async () => {
        app = await setupTestEnvironment({ fresh: true })
        const original = system.getOrThrow.bind(system)
        vi.spyOn(system, 'getOrThrow').mockImplementation((prop) => {
            if (prop === AppSystemProp.FRONTEND_URL) {
                return frontendUrl
            }
            return original(prop)
        })
    })

    afterEach(() => {
        frontendUrl = DEFAULT_FRONTEND_URL
    })

    afterAll(() => {
        vi.restoreAllMocks()
    })

    it('advertises authorization server metadata under the configured base path', async () => {
        const res = await app.inject({
            method: 'GET',
            url: '/.well-known/oauth-authorization-server',
            headers: subpathHeaders,
        })

        expect(res.statusCode).toBe(200)
        const body = res.json()
        expect(body.issuer).toBe('https://example.com/activepieces')
        expect(body.authorization_endpoint).toBe('https://example.com/activepieces/authorize')
        expect(body.token_endpoint).toBe('https://example.com/activepieces/token')
        expect(body.registration_endpoint).toBe('https://example.com/activepieces/register')
        expect(body.revocation_endpoint).toBe('https://example.com/activepieces/revoke')
    })

    it('advertises the protected resource under the configured base path', async () => {
        const res = await app.inject({
            method: 'GET',
            url: '/.well-known/oauth-protected-resource/mcp',
            headers: subpathHeaders,
        })

        expect(res.statusCode).toBe(200)
        const body = res.json()
        expect(body.resource).toBe('https://example.com/activepieces/mcp')
        expect(body.authorization_servers).toEqual(['https://example.com/activepieces'])
    })

    it('returns WWW-Authenticate pointing at the prefixed resource metadata on a project 401', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/mcp',
            headers: subpathHeaders,
            payload: {},
        })

        expect(res.statusCode).toBe(401)
        expect(res.headers['www-authenticate']).toBe(
            'Bearer resource_metadata="https://example.com/activepieces/.well-known/oauth-protected-resource/mcp"',
        )
    })

    it('returns the platform resource metadata in WWW-Authenticate on a platform 401', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/mcp/platform',
            headers: subpathHeaders,
            payload: {},
        })

        expect(res.statusCode).toBe(401)
        expect(res.headers['www-authenticate']).toBe(
            'Bearer resource_metadata="https://example.com/activepieces/.well-known/oauth-protected-resource/mcp/platform"',
        )
    })

    it('keeps the request host with no prefix when FRONTEND_URL has no base path', async () => {
        frontendUrl = 'https://custom-domain.com'

        const res = await app.inject({
            method: 'GET',
            url: '/.well-known/oauth-authorization-server',
            headers: { 'x-forwarded-host': 'custom-domain.com', 'x-forwarded-proto': 'https' },
        })

        expect(res.statusCode).toBe(200)
        const body = res.json()
        expect(body.issuer).toBe('https://custom-domain.com')
        expect(body.authorization_endpoint).toBe('https://custom-domain.com/authorize')
    })
})
