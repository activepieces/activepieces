import { DefaultProjectRole, McpOAuthToken, User, UserStatus } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { mcpOAuthCodeService } from '../../../../src/app/mcp/oauth/code/mcp-oauth-code.service'
import { mcpOAuthRevocationList } from '../../../../src/app/mcp/oauth/token/mcp-oauth-revocation-list'
import { mcpOAuthTokenService, OAuthTokenError } from '../../../../src/app/mcp/oauth/token/mcp-oauth-token.service'
import { userService } from '../../../../src/app/user/user-service'
import { db } from '../../../helpers/db'
import { MCP_OAUTH_REDIRECT_URI, mcpOAuthTestHelpers } from '../../../helpers/mcp-oauth'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
let ctx: TestContext

const CLAUDE_REDIRECT = 'https://claude.ai/api/mcp/auth_callback'

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
        const connection = await mcpOAuthTestHelpers.exchangeGrant({ userId: ctx.user.id, projectId: ctx.project.id, platformId: ctx.platform.id })
        expect((await mcpOAuthTestHelpers.callMcp({ app, accessToken: connection.accessToken })).statusCode).not.toBe(401)

        const revoked = await ctx.post('/v1/mcp-oauth/grants/revoke', { ids: [connection.grantId] })
        expect(revoked.statusCode).toBe(204)

        const afterRevoke = await mcpOAuthTestHelpers.callMcp({ app, accessToken: connection.accessToken })
        expect(afterRevoke.statusCode).toBe(401)
        expect(afterRevoke.headers['www-authenticate']).toContain('error="invalid_token"')
    })

    it('leaves another members live token alone when one grant is revoked', async () => {
        const member = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.ADMIN })
        const mine = await mcpOAuthTestHelpers.exchangeGrant({ userId: ctx.user.id, projectId: ctx.project.id, platformId: ctx.platform.id })
        const theirs = await mcpOAuthTestHelpers.exchangeGrant({ userId: member.user.id, projectId: ctx.project.id, platformId: ctx.platform.id })

        await ctx.post('/v1/mcp-oauth/grants/revoke', { ids: [mine.grantId] })

        expect((await mcpOAuthTestHelpers.callMcp({ app, accessToken: mine.accessToken })).statusCode).toBe(401)
        expect((await mcpOAuthTestHelpers.callMcp({ app, accessToken: theirs.accessToken })).statusCode).not.toBe(401)
    })

    it('leaves an internal chat token working, since it carries no grant', async () => {
        const connection = await mcpOAuthTestHelpers.exchangeGrant({ userId: ctx.user.id, projectId: ctx.project.id, platformId: ctx.platform.id })
        const internalToken = await mcpOAuthTokenService.issueInternalAccessToken({
            userId: ctx.user.id,
            platformId: ctx.platform.id,
            projectId: ctx.project.id,
        })

        await ctx.post('/v1/mcp-oauth/grants/revoke', { ids: [connection.grantId] })

        expect((await mcpOAuthTestHelpers.callMcp({ app, accessToken: internalToken })).statusCode).not.toBe(401)
    })

    it('rejects the access token when the client disconnects through /revoke', async () => {
        const connection = await mcpOAuthTestHelpers.exchangeGrant({ userId: ctx.user.id, projectId: ctx.project.id, platformId: ctx.platform.id })

        const revoked = await app.inject({
            method: 'POST',
            url: '/revoke',
            payload: { token: connection.refreshToken, client_id: connection.clientId, token_type_hint: 'refresh_token' },
        })
        expect(revoked.statusCode).toBe(200)

        expect((await mcpOAuthTestHelpers.callMcp({ app, accessToken: connection.accessToken })).statusCode).toBe(401)
    })

    it('refuses to report a revoke as done when the revocation list write fails', async () => {
        const connection = await mcpOAuthTestHelpers.exchangeGrant({ userId: ctx.user.id, projectId: ctx.project.id, platformId: ctx.platform.id })
        vi.spyOn(mcpOAuthRevocationList, 'revoke').mockRejectedValue(new Error('OOM command not allowed'))

        const response = await ctx.post('/v1/mcp-oauth/grants/revoke', { ids: [connection.grantId] })

        expect(response.statusCode).not.toBe(204)
        expect(response.statusCode).toBeGreaterThanOrEqual(500)
    })

    it.each([
        { change: 'deactivated', apply: (user: User): Promise<unknown> => db.update('user', user.id, { status: UserStatus.INACTIVE }) },
        { change: 'removed from the platform', apply: (user: User): Promise<unknown> => db.update('user', user.id, { platformId: null }) },
        { change: 'left with an unverified email', apply: (user: User): Promise<unknown> => db.update('user_identity', user.identityId, { verified: false }) },
    ])('rejects the access and refresh tokens once the user is $change', async ({ apply }) => {
        const member = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.ADMIN })
        const connection = await mcpOAuthTestHelpers.exchangeGrant({ userId: member.user.id, projectId: ctx.project.id, platformId: ctx.platform.id })

        await apply(member.user)

        expect((await mcpOAuthTestHelpers.callMcp({ app, accessToken: connection.accessToken })).statusCode).toBe(401)
        await expect(mcpOAuthTokenService.refreshAccessToken({
            redirectUris: [CLAUDE_REDIRECT],
            refreshToken: connection.refreshToken,
            clientId: connection.clientId,
            log: app.log,
        })).rejects.toBeInstanceOf(OAuthTokenError)
    })

    it.each([
        { change: 'deactivated', apply: (userId: string): Promise<unknown> => userService(app.log).update({ id: userId, platformId: ctx.platform.id, status: UserStatus.INACTIVE }) },
        { change: 'deleted', apply: (userId: string): Promise<unknown> => userService(app.log).delete({ id: userId, platformId: ctx.platform.id }) },
        { change: 'removed from the platform', apply: (userId: string): Promise<unknown> => userService(app.log).removeFromPlatform({ id: userId, platformId: ctx.platform.id }) },
    ])('revokes the grants of a user who is $change', async ({ apply }) => {
        const member = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.ADMIN })
        const connection = await mcpOAuthTestHelpers.exchangeGrant({ userId: member.user.id, projectId: ctx.project.id, platformId: ctx.platform.id })

        await apply(member.user.id)

        expect((await db.findOneBy<McpOAuthToken>('mcp_oauth_token', { id: connection.grantId }))?.revoked).toBe(true)
        expect(await mcpOAuthRevocationList.isRevoked({ grantId: connection.grantId })).toBe(true)
    })

    it('keeps the OAuth token and an unused code rejected after a deactivated user is reactivated', async () => {
        const member = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.ADMIN })
        const grantee = { userId: member.user.id, projectId: ctx.project.id, platformId: ctx.platform.id }
        const { accessToken } = await mcpOAuthTestHelpers.exchangeGrant(grantee)
        const code = await mcpOAuthTestHelpers.issueCode({ clientId: 'revocation-test-client', codeChallenge: 'challenge', ...grantee })

        await userService(app.log).update({ id: member.user.id, platformId: ctx.platform.id, status: UserStatus.INACTIVE })
        await userService(app.log).update({ id: member.user.id, platformId: ctx.platform.id, status: UserStatus.ACTIVE })

        expect((await mcpOAuthTestHelpers.callMcp({ app, accessToken })).statusCode).toBe(401)
        expect(await mcpOAuthCodeService.consume({ code, clientId: 'revocation-test-client', redirectUri: MCP_OAUTH_REDIRECT_URI })).toBeNull()
    })

    it('answers 503 rather than 401 when the revocation list cannot be read', async () => {
        const connection = await mcpOAuthTestHelpers.exchangeGrant({ userId: ctx.user.id, projectId: ctx.project.id, platformId: ctx.platform.id })
        vi.spyOn(mcpOAuthRevocationList, 'isRevoked').mockRejectedValue(new Error('redis is unreachable'))

        const response = await mcpOAuthTestHelpers.callMcp({ app, accessToken: connection.accessToken })

        expect(response.statusCode).toBe(503)
        expect(response.headers['retry-after']).toBe('1')
        expect(response.headers['www-authenticate']).toBeUndefined()
    })
})
