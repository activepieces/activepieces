import { apId } from '@activepieces/core-utils'
import { DefaultProjectRole } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { db } from '../../../helpers/db'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null
let ctx: TestContext

const IN_30_DAYS = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
const YESTERDAY = () => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

async function grantAccess({ userId, projectId, redirectUris, expiresAt = IN_30_DAYS(), revoked = false }: {
    userId: string
    projectId: string | null
    redirectUris: string[]
    expiresAt?: string
    revoked?: boolean
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
        userId,
        projectId,
        platformId: ctx.platform.id,
        scopes: ['mcp'],
        expiresAt,
        revoked,
        lastUsedAt: null,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
    })
    return id
}

describe('MCP OAuth connected clients', () => {
    beforeAll(async () => {
        app = await setupTestEnvironment()
    })

    beforeEach(async () => {
        ctx = await createTestContext(app!)
    })

    describe('GET /v1/mcp-oauth/clients/me', () => {
        it('lists only the callers own live grants, classified, with the project name', async () => {
            const other = await createMemberContext(app!, ctx, { projectRole: DefaultProjectRole.ADMIN })
            const mine = await grantAccess({ userId: ctx.user.id, projectId: ctx.project.id, redirectUris: ['https://claude.ai/api/mcp/auth_callback'] })
            await grantAccess({ userId: other.user.id, projectId: ctx.project.id, redirectUris: ['cursor://anysphere.cursor-retrieval/oauth/callback'] })

            const response = await ctx.get('/v1/mcp-oauth/clients/me')

            expect(response.statusCode).toBe(200)
            const { data } = response.json()
            expect(data).toHaveLength(1)
            expect(data[0]).toMatchObject({
                id: mine,
                clientKey: 'claude',
                connectsFrom: 'remote',
                projectId: ctx.project.id,
                projectName: ctx.project.displayName,
                lastUsedAt: null,
            })
            expect(data[0].userId).toBeUndefined()
            expect(data[0].user).toBeUndefined()
        })

        it('hides expired and already-revoked grants', async () => {
            await grantAccess({ userId: ctx.user.id, projectId: ctx.project.id, redirectUris: ['https://claude.ai/x'], expiresAt: YESTERDAY() })
            await grantAccess({ userId: ctx.user.id, projectId: ctx.project.id, redirectUris: ['https://claude.ai/x'], revoked: true })

            const response = await ctx.get('/v1/mcp-oauth/clients/me')

            expect(response.json().data).toHaveLength(0)
        })

        it('renders a platform-wide grant with no project name', async () => {
            await grantAccess({ userId: ctx.user.id, projectId: null, redirectUris: ['http://localhost:1455/callback/abc'] })

            const { data } = (await ctx.get('/v1/mcp-oauth/clients/me')).json()

            expect(data[0]).toMatchObject({ clientKey: 'codex', connectsFrom: 'local', projectId: null, projectName: null })
        })
    })

    describe('GET /v1/mcp-oauth/clients', () => {
        it('lists every members grant on the project, with who holds it', async () => {
            const member = await createMemberContext(app!, ctx, { projectRole: DefaultProjectRole.EDITOR })
            await grantAccess({ userId: member.user.id, projectId: ctx.project.id, redirectUris: ['http://localhost:54545/callback'] })

            const response = await ctx.get('/v1/mcp-oauth/clients', { projectId: ctx.project.id })

            expect(response.statusCode).toBe(200)
            const { data } = response.json()
            expect(data).toHaveLength(1)
            expect(data[0]).toMatchObject({
                clientKey: 'claude-code',
                userId: member.user.id,
                user: { email: member.userIdentity.email },
            })
        })

        it('still lists a grant whose holder was deleted, so it stays revokable', async () => {
            const member = await createMemberContext(app!, ctx, { projectRole: DefaultProjectRole.EDITOR })
            const id = await grantAccess({ userId: member.user.id, projectId: ctx.project.id, redirectUris: ['https://claude.ai/x'] })
            await databaseConnection().getRepository('project_member').delete({ userId: member.user.id })
            await databaseConnection().getRepository('user').delete({ id: member.user.id })

            const response = await ctx.get('/v1/mcp-oauth/clients', { projectId: ctx.project.id })

            expect(response.statusCode).toBe(200)
            const { data } = response.json()
            expect(data).toHaveLength(1)
            expect(data[0]).toMatchObject({ id, userId: member.user.id })
            expect(data[0].user).toBeUndefined()
        })

        it('refuses a VIEWER, who has READ_MCP but not WRITE_MCP', async () => {
            const viewer = await createMemberContext(app!, ctx, { projectRole: DefaultProjectRole.VIEWER })

            const response = await viewer.get('/v1/mcp-oauth/clients', { projectId: ctx.project.id })

            expect(response.statusCode).toBe(403)
        })
    })

    describe('POST /v1/mcp-oauth/clients/me/revoke', () => {
        it('revokes the callers own grant, which then leaves the list', async () => {
            const id = await grantAccess({ userId: ctx.user.id, projectId: ctx.project.id, redirectUris: ['https://claude.ai/x'] })

            const response = await ctx.post('/v1/mcp-oauth/clients/me/revoke', { ids: [id] })

            expect(response.statusCode).toBe(204)
            expect((await ctx.get('/v1/mcp-oauth/clients/me')).json().data).toHaveLength(0)
            expect(await db.findOneBy('mcp_oauth_token', { id })).toMatchObject({ revoked: true })
        })

        it('writes nothing at all when one id in the batch is not the callers', async () => {
            const other = await createMemberContext(app!, ctx, { projectRole: DefaultProjectRole.ADMIN })
            const mine = await grantAccess({ userId: ctx.user.id, projectId: ctx.project.id, redirectUris: ['https://claude.ai/x'] })
            const theirs = await grantAccess({ userId: other.user.id, projectId: ctx.project.id, redirectUris: ['https://claude.ai/x'] })

            const response = await ctx.post('/v1/mcp-oauth/clients/me/revoke', { ids: [mine, theirs] })

            expect(response.statusCode).toBe(403)
            expect(await db.findOneBy('mcp_oauth_token', { id: mine })).toMatchObject({ revoked: false })
            expect(await db.findOneBy('mcp_oauth_token', { id: theirs })).toMatchObject({ revoked: false })
        })

        it('rejects an empty batch', async () => {
            const response = await ctx.post('/v1/mcp-oauth/clients/me/revoke', { ids: [] })

            expect(response.statusCode).toBe(400)
        })
    })

    describe('POST /v1/mcp-oauth/clients/revoke', () => {
        it('lets a project admin revoke another members grant', async () => {
            const member = await createMemberContext(app!, ctx, { projectRole: DefaultProjectRole.EDITOR })
            const id = await grantAccess({ userId: member.user.id, projectId: ctx.project.id, redirectUris: ['https://claude.ai/x'] })

            const response = await ctx.post('/v1/mcp-oauth/clients/revoke', { projectId: ctx.project.id, ids: [id] })

            expect(response.statusCode).toBe(204)
            expect(await db.findOneBy('mcp_oauth_token', { id })).toMatchObject({ revoked: true })
        })

        it('refuses a grant that belongs to a different project', async () => {
            const elsewhere = await createTestContext(app!)
            const id = await grantAccess({ userId: ctx.user.id, projectId: elsewhere.project.id, redirectUris: ['https://claude.ai/x'] })

            const response = await ctx.post('/v1/mcp-oauth/clients/revoke', { projectId: ctx.project.id, ids: [id] })

            expect(response.statusCode).toBe(403)
            expect(await db.findOneBy('mcp_oauth_token', { id })).toMatchObject({ revoked: false })
        })
    })
})
