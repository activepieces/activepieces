import { FastifyInstance } from 'fastify'
import { beforeAll, describe, expect, it } from 'vitest'
import { mcpOAuthTokenService } from '../../../../src/app/mcp/oauth/token/mcp-oauth-token.service'
import { McpGrantee, mcpOAuthTestHelpers } from '../../../helpers/mcp-oauth'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
let grantee: McpGrantee

function requireRefreshToken(response: { refresh_token?: string }): string {
    if (response.refresh_token === undefined) {
        throw new Error('expected a refresh_token in the token response')
    }
    return response.refresh_token
}

describe('MCP OAuth token refresh', () => {
    beforeAll(async () => {
        app = await setupTestEnvironment({ fresh: true })
        const ctx = await createTestContext(app)
        grantee = { userId: ctx.user.id, projectId: ctx.project.id, platformId: ctx.platform.id }
    })

    it('echoes the presented refresh token back so clients cannot lose it', async () => {
        const { clientId, refreshToken } = await mcpOAuthTestHelpers.exchangeGrant(grantee)

        const refreshed = await mcpOAuthTokenService.refreshAccessToken({ redirectUris: [], refreshToken, clientId, log: app.log })

        expect(refreshed.access_token).toBeTypeOf('string')
        expect(refreshed.refresh_token).toBe(refreshToken)
    })

    it('keeps refreshing indefinitely using the token from the previous response', async () => {
        const { clientId, refreshToken: first } = await mcpOAuthTestHelpers.exchangeGrant(grantee)

        const second = await mcpOAuthTokenService.refreshAccessToken({ redirectUris: [], refreshToken: first, clientId, log: app.log })
        const third = await mcpOAuthTokenService.refreshAccessToken({ redirectUris: [], refreshToken: requireRefreshToken(second), clientId, log: app.log })

        expect(third.refresh_token).toBe(first)
    })

    it('returns the refresh token in the /token HTTP response a client persists', async () => {
        const { clientId, refreshToken } = await mcpOAuthTestHelpers.exchangeGrant(grantee)

        const res = await app.inject({
            method: 'POST',
            url: '/token',
            payload: {
                grant_type: 'refresh_token',
                client_id: clientId,
                refresh_token: refreshToken,
            },
        })

        expect(res.statusCode).toBe(200)
        const body = res.json()
        expect(body.access_token).toBeTypeOf('string')
        expect(body.refresh_token).toBe(refreshToken)
    })
})
