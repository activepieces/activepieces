import { FastifyInstance } from 'fastify'
import { beforeAll, describe, expect, it } from 'vitest'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { mcpOAuthClientService } from '../../../../src/app/mcp/oauth/client/mcp-oauth-client.service'
import { MCP_OAUTH_REDIRECT_URI, mcpOAuthTestHelpers } from '../../../helpers/mcp-oauth'
import { setupTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

async function redeemCode({ clientId, headers, body }: {
    clientId: string
    headers?: Record<string, string>
    body?: Record<string, string>
}): Promise<{ statusCode: number, json: () => Record<string, string> }> {
    const { verifier, challenge } = mcpOAuthTestHelpers.generatePkce()
    const code = await mcpOAuthTestHelpers.issueCode({ clientId, codeChallenge: challenge })
    return app.inject({
        method: 'POST',
        url: '/token',
        headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers },
        payload: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            code_verifier: verifier,
            redirect_uri: MCP_OAUTH_REDIRECT_URI,
            ...body,
        }).toString(),
    })
}

function renew({ refreshToken, headers, body }: {
    refreshToken: string
    headers?: Record<string, string>
    body?: Record<string, string>
}): ReturnType<FastifyInstance['inject']> {
    return app.inject({
        method: 'POST',
        url: '/token',
        headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers },
        payload: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken, ...body }).toString(),
    })
}

describe('MCP OAuth client profiles', () => {
    beforeAll(async () => {
        app = await setupTestEnvironment({ fresh: true })
    })

    it('a client that omits the auth method and uses the Authorization header connects and renews', async () => {
        const client = await mcpOAuthTestHelpers.registerClient({ app })
        expect(client.token_endpoint_auth_method).toBe('client_secret_basic')
        const authorization = mcpOAuthTestHelpers.basicHeader({ clientId: client.client_id, clientSecret: client.client_secret ?? '' })

        const exchanged = await redeemCode({ clientId: client.client_id, headers: { authorization } })
        expect(exchanged.statusCode).toBe(200)

        const renewed = await renew({ refreshToken: exchanged.json().refresh_token, headers: { authorization } })
        expect(renewed.statusCode).toBe(200)
    })

    it('a client that registers public and sends no credentials connects and renews', async () => {
        const client = await mcpOAuthTestHelpers.registerClient({ app, tokenEndpointAuthMethod: 'none' })
        expect(client.client_secret).toBeUndefined()

        const exchanged = await redeemCode({ clientId: client.client_id, body: { client_id: client.client_id } })
        expect(exchanged.statusCode).toBe(200)

        const renewed = await renew({ refreshToken: exchanged.json().refresh_token, body: { client_id: client.client_id } })
        expect(renewed.statusCode).toBe(200)
    })

    it('a client that puts its secret in the body connects and renews', async () => {
        const client = await mcpOAuthTestHelpers.registerClient({ app, tokenEndpointAuthMethod: 'client_secret_post' })
        const credentials = { client_id: client.client_id, client_secret: client.client_secret ?? '' }

        const exchanged = await redeemCode({ clientId: client.client_id, body: credentials })
        expect(exchanged.statusCode).toBe(200)

        const renewed = await renew({ refreshToken: exchanged.json().refresh_token, body: credentials })
        expect(renewed.statusCode).toBe(200)
    })

    it('a client registered before the fix keeps working across the upgrade, including renewal', async () => {
        const legacy = await mcpOAuthClientService.register({
            redirectUris: [MCP_OAUTH_REDIRECT_URI],
            tokenEndpointAuthMethod: 'client_secret_post',
        })
        await databaseConnection().query(
            'UPDATE mcp_oauth_client SET "tokenEndpointAuthMethod" = \'none\' WHERE "clientId" = $1',
            [legacy.client_id],
        )

        const stillSendingItsSecret = await redeemCode({
            clientId: legacy.client_id,
            body: { client_id: legacy.client_id, client_secret: legacy.client_secret ?? '' },
        })
        expect(stillSendingItsSecret.statusCode).toBe(200)

        const renewed = await renew({
            refreshToken: stillSendingItsSecret.json().refresh_token,
            body: { client_id: legacy.client_id, client_secret: legacy.client_secret ?? '' },
        })
        expect(renewed.statusCode).toBe(200)

        const withoutItsSecret = await redeemCode({ clientId: legacy.client_id, body: { client_id: legacy.client_id } })
        expect(withoutItsSecret.statusCode).toBe(200)
    })

    it('renewal yields an access token the MCP endpoint accepts', async () => {
        const client = await mcpOAuthTestHelpers.registerClient({ app, tokenEndpointAuthMethod: 'none' })
        const exchanged = await redeemCode({ clientId: client.client_id, body: { client_id: client.client_id } })

        const renewed = await renew({ refreshToken: exchanged.json().refresh_token, body: { client_id: client.client_id } })
        const secondAccessToken = renewed.json().access_token

        expect(renewed.statusCode).toBe(200)
        expect(secondAccessToken).toBeDefined()
        expect(renewed.json().expires_in).toBe(900)
        const used = await app.inject({
            method: 'POST',
            url: '/mcp',
            headers: { authorization: `Bearer ${secondAccessToken}`, 'content-type': 'application/json' },
            payload: {},
        })
        expect(used.json().message).not.toBe('Invalid or expired access token')
    })

    it('refuses a bearer token that is not one of ours', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/mcp',
            headers: { authorization: 'Bearer not-a-real-token', 'content-type': 'application/json' },
            payload: {},
        })

        expect(res.statusCode).toBe(401)
        expect(res.headers['www-authenticate']).toContain('error="invalid_token"')
    })
})
