import { apId } from '@activepieces/core-utils'
import { DefaultProjectRole, McpOAuthGrant, PlatformRole } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { mcpOAuthClientIdentity } from '../../../../src/app/mcp/oauth/client/mcp-oauth-client-identity'
import { db } from '../../../helpers/db'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null
let ctx: TestContext

const IN_30_DAYS = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
const YESTERDAY = () => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

const CLAUDE_REDIRECT = 'https://claude.ai/api/mcp/auth_callback'
const CURSOR_REDIRECT = 'cursor://anysphere.cursor-retrieval/oauth/callback'
const CODEX_REDIRECT = 'http://localhost:1455/callback/abc'

async function grantAccess({ userId, projectId, platformId, redirectUris, expiresAt = IN_30_DAYS(), revoked = false, unidentified = false }: {
    userId: string
    projectId: string | null
    platformId?: string
    redirectUris: string[]
    expiresAt?: string
    revoked?: boolean
    unidentified?: boolean
}): Promise<string> {
    const clientId = apId()
    await db.save('mcp_oauth_client', {
        id: apId(),
        clientId,
        clientSecret: null,
        clientSecretExpiresAt: 0,
        clientIdIssuedAt: Math.floor(Date.now() / 1000),
        redirectUris,
        clientName: 'A Registered Name',
        grantTypes: ['authorization_code'],
        tokenEndpointAuthMethod: 'none',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
    })
    const id = apId()
    await db.save('mcp_oauth_token', {
        id,
        refreshToken: apId() + apId(),
        clientId,
        clientKey: unidentified ? null : mcpOAuthClientIdentity.detectClientKey({ redirectUris }),
        userId,
        projectId,
        platformId: platformId ?? ctx.platform.id,
        scopes: ['mcp'],
        expiresAt,
        revoked,
        lastUsedAt: null,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
    })
    return id
}

async function promoteToOperator(memberCtx: TestContext): Promise<void> {
    await db.update('user', memberCtx.user.id, { platformRole: PlatformRole.OPERATOR })
}

describe('MCP OAuth connected clients', () => {
    beforeAll(async () => {
        app = await setupTestEnvironment()
    })

    beforeEach(async () => {
        ctx = await createTestContext(app!)
    })

    describe('GET /v1/mcp-oauth/grants scope', () => {
        it('lists every members grant on the platform for a platform admin', async () => {
            const other = await createMemberContext(app!, ctx, { projectRole: DefaultProjectRole.ADMIN })
            const mine = await grantAccess({ userId: ctx.user.id, projectId: ctx.project.id, redirectUris: [CLAUDE_REDIRECT] })
            const theirs = await grantAccess({ userId: other.user.id, projectId: ctx.project.id, redirectUris: [CURSOR_REDIRECT] })

            const response = await ctx.get('/v1/mcp-oauth/grants')

            expect(response.statusCode).toBe(200)
            const { data } = response.json()
            expect(data.map((row: { id: string }) => row.id).sort()).toEqual([mine, theirs].sort())
        })

        it('lists every members grant for a platform operator', async () => {
            const operator = await createMemberContext(app!, ctx, { projectRole: DefaultProjectRole.VIEWER })
            await promoteToOperator(operator)
            await grantAccess({ userId: ctx.user.id, projectId: ctx.project.id, redirectUris: [CLAUDE_REDIRECT] })
            await grantAccess({ userId: operator.user.id, projectId: ctx.project.id, redirectUris: [CURSOR_REDIRECT] })

            const { data } = (await operator.get('/v1/mcp-oauth/grants')).json()

            expect(data).toHaveLength(2)
        })

        it('lists only their own grants for a non-privileged member', async () => {
            const member = await createMemberContext(app!, ctx, { projectRole: DefaultProjectRole.ADMIN })
            await grantAccess({ userId: ctx.user.id, projectId: ctx.project.id, redirectUris: [CLAUDE_REDIRECT] })
            const theirs = await grantAccess({ userId: member.user.id, projectId: ctx.project.id, redirectUris: [CURSOR_REDIRECT] })

            const { data } = (await member.get('/v1/mcp-oauth/grants')).json()

            expect(data).toHaveLength(1)
            expect(data[0]).toMatchObject({ id: theirs, clientKey: 'cursor' })
        })

        it('never crosses a platform boundary', async () => {
            const elsewhere = await createTestContext(app!)
            await grantAccess({ userId: elsewhere.user.id, projectId: elsewhere.project.id, platformId: elsewhere.platform.id, redirectUris: [CLAUDE_REDIRECT] })

            const { data } = (await ctx.get('/v1/mcp-oauth/grants')).json()

            expect(data).toHaveLength(0)
        })

        it('hides expired and already-revoked grants', async () => {
            await grantAccess({ userId: ctx.user.id, projectId: ctx.project.id, redirectUris: [CLAUDE_REDIRECT], expiresAt: YESTERDAY() })
            await grantAccess({ userId: ctx.user.id, projectId: ctx.project.id, redirectUris: [CLAUDE_REDIRECT], revoked: true })

            const { data } = (await ctx.get('/v1/mcp-oauth/grants')).json()

            expect(data).toHaveLength(0)
        })

        it('renders a platform-wide grant with no project name, and the member who signed in', async () => {
            await grantAccess({ userId: ctx.user.id, projectId: null, redirectUris: [CODEX_REDIRECT] })

            const { data } = (await ctx.get('/v1/mcp-oauth/grants')).json()

            expect(data[0]).toMatchObject({
                clientKey: 'codex',
                projectId: null,
                projectName: null,
                member: { id: ctx.user.id, email: ctx.userIdentity.email },
            })
        })

        it('renders a null member when the user who signed in has been deleted', async () => {
            const member = await createMemberContext(app!, ctx, { projectRole: DefaultProjectRole.ADMIN })
            const orphaned = await grantAccess({ userId: member.user.id, projectId: ctx.project.id, redirectUris: [CLAUDE_REDIRECT] })
            await db.delete('user', member.user.id)

            const { data } = (await ctx.get('/v1/mcp-oauth/grants')).json()

            expect(data.find((grant: { id: string }) => grant.id === orphaned)).toMatchObject({
                clientKey: 'claude',
                member: null,
            })
        })
    })

    describe('GET /v1/mcp-oauth/grants filters', () => {
        it('filters by client key', async () => {
            await grantAccess({ userId: ctx.user.id, projectId: ctx.project.id, redirectUris: [CLAUDE_REDIRECT] })
            const cursor = await grantAccess({ userId: ctx.user.id, projectId: ctx.project.id, redirectUris: [CURSOR_REDIRECT] })

            const { data } = (await ctx.get('/v1/mcp-oauth/grants', { clientKeys: ['cursor'] })).json()

            expect(data).toHaveLength(1)
            expect(data[0].id).toBe(cursor)
        })

        it('returns an empty page, not everything, when no client matches the key', async () => {
            await grantAccess({ userId: ctx.user.id, projectId: ctx.project.id, redirectUris: [CLAUDE_REDIRECT] })

            const { data } = (await ctx.get('/v1/mcp-oauth/grants', { clientKeys: ['windsurf'] })).json()

            expect(data).toHaveLength(0)
        })

        it('reads a grant stored before the client key existed as unknown', async () => {
            const legacy = await grantAccess({ userId: ctx.user.id, projectId: ctx.project.id, redirectUris: [CLAUDE_REDIRECT], unidentified: true })

            const { data } = (await ctx.get('/v1/mcp-oauth/grants')).json()

            expect(data[0]).toMatchObject({ id: legacy, clientKey: 'unknown', clientName: 'A Registered Name' })
        })

        it('matches a grant with no stored client key on the unknown key', async () => {
            const legacy = await grantAccess({ userId: ctx.user.id, projectId: ctx.project.id, redirectUris: [CLAUDE_REDIRECT], unidentified: true })
            await grantAccess({ userId: ctx.user.id, projectId: ctx.project.id, redirectUris: [CURSOR_REDIRECT] })

            const { data } = (await ctx.get('/v1/mcp-oauth/grants', { clientKeys: ['unknown'] })).json()

            expect(data).toHaveLength(1)
            expect(data[0].id).toBe(legacy)
        })

        it('filters by member', async () => {
            const other = await createMemberContext(app!, ctx, { projectRole: DefaultProjectRole.ADMIN })
            await grantAccess({ userId: ctx.user.id, projectId: ctx.project.id, redirectUris: [CLAUDE_REDIRECT] })
            const theirs = await grantAccess({ userId: other.user.id, projectId: ctx.project.id, redirectUris: [CURSOR_REDIRECT] })

            const { data } = (await ctx.get('/v1/mcp-oauth/grants', { memberIds: [other.user.id] })).json()

            expect(data).toHaveLength(1)
            expect(data[0].id).toBe(theirs)
        })

        it('filters platform-wide grants by the platform-wide sentinel', async () => {
            await grantAccess({ userId: ctx.user.id, projectId: ctx.project.id, redirectUris: [CLAUDE_REDIRECT] })
            const platformWide = await grantAccess({ userId: ctx.user.id, projectId: null, redirectUris: [CODEX_REDIRECT] })

            const { data } = (await ctx.get('/v1/mcp-oauth/grants', { projectIds: ['platform-wide'] })).json()

            expect(data).toHaveLength(1)
            expect(data[0].id).toBe(platformWide)
        })
    })

    describe('GET /v1/mcp-oauth/grants pagination', () => {
        it('walks every grant exactly once across pages', async () => {
            const seeded = [
                await grantAccess({ userId: ctx.user.id, projectId: ctx.project.id, redirectUris: [CLAUDE_REDIRECT] }),
                await grantAccess({ userId: ctx.user.id, projectId: ctx.project.id, redirectUris: [CURSOR_REDIRECT] }),
                await grantAccess({ userId: ctx.user.id, projectId: null, redirectUris: [CODEX_REDIRECT] }),
            ]

            const firstPage = (await ctx.get('/v1/mcp-oauth/grants', { limit: 2 })).json()
            expect(firstPage.data).toHaveLength(2)
            expect(firstPage.next).not.toBeNull()

            const secondPage = (await ctx.get('/v1/mcp-oauth/grants', { limit: 2, cursor: firstPage.next })).json()
            expect(secondPage.data).toHaveLength(1)
            expect(secondPage.next).toBeNull()

            const walked = [...firstPage.data, ...secondPage.data].map((grant: McpOAuthGrant) => grant.id)
            expect(new Set(walked)).toEqual(new Set(seeded))
        })

        it('carries the filters onto the next page', async () => {
            await grantAccess({ userId: ctx.user.id, projectId: ctx.project.id, redirectUris: [CURSOR_REDIRECT] })
            const claude = [
                await grantAccess({ userId: ctx.user.id, projectId: ctx.project.id, redirectUris: [CLAUDE_REDIRECT] }),
                await grantAccess({ userId: ctx.user.id, projectId: ctx.project.id, redirectUris: [CLAUDE_REDIRECT] }),
            ]

            const firstPage = (await ctx.get('/v1/mcp-oauth/grants', { limit: 1, clientKeys: ['claude'] })).json()
            const secondPage = (await ctx.get('/v1/mcp-oauth/grants', { limit: 1, clientKeys: ['claude'], cursor: firstPage.next })).json()

            const walked = [...firstPage.data, ...secondPage.data].map((grant: McpOAuthGrant) => grant.id)
            expect(new Set(walked)).toEqual(new Set(claude))
            expect(secondPage.next).toBeNull()
        })
    })

    describe('POST /v1/mcp-oauth/grants/revoke', () => {
        it('revokes a grant, which then leaves the list', async () => {
            const id = await grantAccess({ userId: ctx.user.id, projectId: ctx.project.id, redirectUris: [CLAUDE_REDIRECT] })

            const response = await ctx.post('/v1/mcp-oauth/grants/revoke', { ids: [id] })

            expect(response.statusCode).toBe(204)
            expect((await ctx.get('/v1/mcp-oauth/grants')).json().data).toHaveLength(0)
            expect(await db.findOneBy('mcp_oauth_token', { id })).toMatchObject({ revoked: true })
        })

        it('lets a platform admin revoke another members grant', async () => {
            const other = await createMemberContext(app!, ctx, { projectRole: DefaultProjectRole.ADMIN })
            const theirs = await grantAccess({ userId: other.user.id, projectId: ctx.project.id, redirectUris: [CLAUDE_REDIRECT] })

            const response = await ctx.post('/v1/mcp-oauth/grants/revoke', { ids: [theirs] })

            expect(response.statusCode).toBe(204)
            expect(await db.findOneBy('mcp_oauth_token', { id: theirs })).toMatchObject({ revoked: true })
        })

        it('writes nothing at all when one id in a members batch is not theirs', async () => {
            const member = await createMemberContext(app!, ctx, { projectRole: DefaultProjectRole.ADMIN })
            const theirs = await grantAccess({ userId: member.user.id, projectId: ctx.project.id, redirectUris: [CLAUDE_REDIRECT] })
            const mine = await grantAccess({ userId: ctx.user.id, projectId: ctx.project.id, redirectUris: [CLAUDE_REDIRECT] })

            const response = await member.post('/v1/mcp-oauth/grants/revoke', { ids: [theirs, mine] })

            expect(response.statusCode).toBe(403)
            expect(await db.findOneBy('mcp_oauth_token', { id: theirs })).toMatchObject({ revoked: false })
            expect(await db.findOneBy('mcp_oauth_token', { id: mine })).toMatchObject({ revoked: false })
        })

        it('rejects an empty batch', async () => {
            const response = await ctx.post('/v1/mcp-oauth/grants/revoke', { ids: [] })

            expect(response.statusCode).toBe(400)
        })
    })
})
