import { createHash, randomBytes } from 'crypto'
import { DefaultProjectRole, McpOAuthToken } from '@activepieces/shared'
import { FastifyInstance, LightMyRequestResponse } from 'fastify'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { mcpOAuthClientService } from '../../../../src/app/mcp/oauth/client/mcp-oauth-client.service'
import { mcpOAuthRevocationList } from '../../../../src/app/mcp/oauth/token/mcp-oauth-revocation-list'
import { mcpOAuthTokenService } from '../../../../src/app/mcp/oauth/token/mcp-oauth-token.service'
import { db } from '../../../helpers/db'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
let ctx: TestContext

const CLAUDE_REDIRECT = 'https://claude.ai/api/mcp/auth_callback'

const INITIALIZE_REQUEST = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'revocation-test', version: '1.0.0' },
    },
}

async function connectClient({ userId, projectId, platformId }: { userId: string, projectId: string | null, platformId: string }): Promise<Connection> {
    const codeVerifier = randomBytes(32).toString('base64url')
    const codeChallenge = createHash('sha256').update(codeVerifier).digest().toString('base64url')
    const { client_id: clientId } = await mcpOAuthClientService.register({
        redirectUris: [CLAUDE_REDIRECT],
        tokenEndpointAuthMethod: 'none',
    })
    const tokens = await mcpOAuthTokenService.exchangeCode({
        redirectUris: [CLAUDE_REDIRECT],
        codeVerifier,
        codeChallenge,
        codeChallengeMethod: 'S256',
        clientId,
        userId,
        projectId,
        platformId,
        scopes: ['mcp'],
    })
    const grant = await db.findOneBy<McpOAuthToken>('mcp_oauth_token', { clientId })
    if (grant === null) {
        throw new Error('expected exchangeCode to persist a grant')
    }
    if (tokens.refresh_token === undefined) {
        throw new Error('expected exchangeCode to return a refresh token')
    }
    return { grantId: grant.id, clientId, accessToken: tokens.access_token, refreshToken: tokens.refresh_token }
}

function callMcp(accessToken: string): Promise<LightMyRequestResponse> {
    return app.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
            authorization: `Bearer ${accessToken}`,
            accept: 'application/json, text/event-stream',
            'content-type': 'application/json',
        },
        payload: INITIALIZE_REQUEST,
    })
}

describe('MCP OAuth revocation list', () => {
    beforeAll(async () => {
        app = await setupTestEnvironment({ fresh: true })
    })

    beforeEach(async () => {
        ctx = await createTestContext(app)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('rejects the already-issued access token as soon as the grant is revoked', async () => {
        const connection = await connectClient({ userId: ctx.user.id, projectId: ctx.project.id, platformId: ctx.platform.id })
        expect((await callMcp(connection.accessToken)).statusCode).not.toBe(401)

        const revoked = await ctx.post('/v1/mcp-oauth/grants/revoke', { ids: [connection.grantId] })
        expect(revoked.statusCode).toBe(204)

        const afterRevoke = await callMcp(connection.accessToken)
        expect(afterRevoke.statusCode).toBe(401)
        expect(afterRevoke.headers['www-authenticate']).toContain('error="invalid_token"')
    })

    it('leaves another members live token alone when one grant is revoked', async () => {
        const member = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.ADMIN })
        const mine = await connectClient({ userId: ctx.user.id, projectId: ctx.project.id, platformId: ctx.platform.id })
        const theirs = await connectClient({ userId: member.user.id, projectId: ctx.project.id, platformId: ctx.platform.id })

        await ctx.post('/v1/mcp-oauth/grants/revoke', { ids: [mine.grantId] })

        expect((await callMcp(mine.accessToken)).statusCode).toBe(401)
        expect((await callMcp(theirs.accessToken)).statusCode).not.toBe(401)
    })

    it('leaves an internal chat token working, since it carries no grant', async () => {
        const connection = await connectClient({ userId: ctx.user.id, projectId: ctx.project.id, platformId: ctx.platform.id })
        const internalToken = await mcpOAuthTokenService.issueInternalAccessToken({
            userId: ctx.user.id,
            platformId: ctx.platform.id,
            projectId: ctx.project.id,
        })

        await ctx.post('/v1/mcp-oauth/grants/revoke', { ids: [connection.grantId] })

        expect((await callMcp(internalToken)).statusCode).not.toBe(401)
    })

    it('rejects the access token when the client disconnects through /revoke', async () => {
        const connection = await connectClient({ userId: ctx.user.id, projectId: ctx.project.id, platformId: ctx.platform.id })

        const revoked = await app.inject({
            method: 'POST',
            url: '/revoke',
            payload: { token: connection.refreshToken, client_id: connection.clientId, token_type_hint: 'refresh_token' },
        })
        expect(revoked.statusCode).toBe(200)

        expect((await callMcp(connection.accessToken)).statusCode).toBe(401)
    })

    it('refuses to report a revoke as done when the revocation list write fails', async () => {
        const connection = await connectClient({ userId: ctx.user.id, projectId: ctx.project.id, platformId: ctx.platform.id })
        vi.spyOn(mcpOAuthRevocationList, 'revoke').mockRejectedValue(new Error('OOM command not allowed'))

        const response = await ctx.post('/v1/mcp-oauth/grants/revoke', { ids: [connection.grantId] })

        expect(response.statusCode).not.toBe(204)
        expect(response.statusCode).toBeGreaterThanOrEqual(500)
    })

    it('answers 503 rather than 401 when the revocation list cannot be read', async () => {
        const connection = await connectClient({ userId: ctx.user.id, projectId: ctx.project.id, platformId: ctx.platform.id })
        vi.spyOn(mcpOAuthRevocationList, 'isRevoked').mockRejectedValue(new Error('redis is unreachable'))

        const response = await callMcp(connection.accessToken)

        expect(response.statusCode).toBe(503)
        expect(response.headers['retry-after']).toBe('1')
        expect(response.headers['www-authenticate']).toBeUndefined()
    })
})

type Connection = {
    grantId: string
    clientId: string
    accessToken: string
    refreshToken: string
}
