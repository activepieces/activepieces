import { createHash, randomBytes } from 'crypto'
import { apId } from '@activepieces/core-utils'
import { FastifyInstance } from 'fastify'
import { beforeAll, describe, expect, it } from 'vitest'
import { mcpOAuthClientService } from '../../../../src/app/mcp/oauth/client/mcp-oauth-client.service'
import { mcpOAuthTokenService } from '../../../../src/app/mcp/oauth/token/mcp-oauth-token.service'
import { setupTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

function requireRefreshToken(response: { refresh_token?: string }): string {
    if (response.refresh_token === undefined) {
        throw new Error('expected a refresh_token in the token response')
    }
    return response.refresh_token
}

async function exchangeFreshCode(clientId: string): Promise<string> {
    const codeVerifier = randomBytes(32).toString('base64url')
    const codeChallenge = createHash('sha256').update(codeVerifier).digest().toString('base64url')
    const tokens = await mcpOAuthTokenService.exchangeCode({
        codeVerifier,
        codeChallenge,
        codeChallengeMethod: 'S256',
        clientId,
        userId: apId(),
        projectId: apId(),
        platformId: apId(),
        scopes: ['mcp'],
    })
    return requireRefreshToken(tokens)
}

describe('MCP OAuth token refresh', () => {
    beforeAll(async () => {
        app = await setupTestEnvironment({ fresh: true })
    })

    it('echoes the presented refresh token back so clients cannot lose it', async () => {
        const clientId = apId()
        const refreshToken = await exchangeFreshCode(clientId)

        const refreshed = await mcpOAuthTokenService.refreshAccessToken({ refreshToken, clientId })

        expect(refreshed.access_token).toBeTypeOf('string')
        expect(refreshed.refresh_token).toBe(refreshToken)
    })

    it('keeps refreshing indefinitely using the token from the previous response', async () => {
        const clientId = apId()
        const first = await exchangeFreshCode(clientId)

        const second = await mcpOAuthTokenService.refreshAccessToken({ refreshToken: first, clientId })
        const third = await mcpOAuthTokenService.refreshAccessToken({ refreshToken: requireRefreshToken(second), clientId })

        expect(third.refresh_token).toBe(first)
    })

    it('returns the refresh token in the /token HTTP response a client persists', async () => {
        const client = await mcpOAuthClientService.register({
            redirectUris: ['https://example.com/callback'],
            tokenEndpointAuthMethod: 'none',
        })
        const refreshToken = await exchangeFreshCode(client.client_id)

        const res = await app.inject({
            method: 'POST',
            url: '/token',
            payload: {
                grant_type: 'refresh_token',
                client_id: client.client_id,
                refresh_token: refreshToken,
            },
        })

        expect(res.statusCode).toBe(200)
        const body = res.json()
        expect(body.access_token).toBeTypeOf('string')
        expect(body.refresh_token).toBe(refreshToken)
    })
})
