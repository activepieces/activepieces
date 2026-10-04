import { apId, Permission, RoleType } from '@activepieces/core-utils'
import { DefaultProjectRole, PlatformRole, PrincipalType, UserIdentityProvider } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import { MCP_OAUTH_REDIRECT_URI, mcpOAuthTestHelpers } from '../../../helpers/mcp-oauth'
import { createMockProjectMember, createMockProjectRole, mockBasicUser } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

const PLATFORM_RESOURCE = 'https://cloud.activepieces.com/mcp/platform'

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function createAuthRequestId(): Promise<string> {
    const client = await mcpOAuthTestHelpers.registerClient({ app, tokenEndpointAuthMethod: 'none' })
    const { challenge } = mcpOAuthTestHelpers.generatePkce()
    const consent = await app.inject({
        method: 'GET',
        url: '/authorize?' + new URLSearchParams({
            client_id: client.client_id,
            redirect_uri: MCP_OAUTH_REDIRECT_URI,
            response_type: 'code',
            code_challenge: challenge,
            code_challenge_method: 'S256',
            scope: 'mcp',
            resource: PLATFORM_RESOURCE,
        }).toString(),
    })
    return new URL(String(consent.headers.location), MCP_OAUTH_REDIRECT_URI).searchParams.get('authRequestId') ?? ''
}

async function approveAs({ token, projectId }: { token: string, projectId?: string }) {
    return app.inject({
        method: 'POST',
        url: '/api/v1/mcp-oauth/approve',
        headers: { authorization: `Bearer ${token}` },
        payload: {
            authRequestId: await createAuthRequestId(),
            ...(projectId ? { projectId } : {}),
        },
    })
}

async function addMember({ ctx, permissions, provider }: {
    ctx: TestContext
    permissions: Permission[]
    provider?: UserIdentityProvider
}): Promise<{ token: string }> {
    const { mockUser } = await mockBasicUser({
        userIdentity: { provider: provider ?? UserIdentityProvider.EMAIL, verified: true },
        user: { platformId: ctx.platform.id, platformRole: PlatformRole.MEMBER },
    })
    const role = createMockProjectRole({
        platformId: ctx.platform.id,
        name: `role-${apId()}`,
        permissions,
        type: RoleType.CUSTOM,
    })
    await db.save('project_role', role)
    await db.save('project_member', createMockProjectMember({
        userId: mockUser.id,
        platformId: ctx.platform.id,
        projectId: ctx.project.id,
        projectRoleId: role.id,
    }))
    const token = await generateMockToken({
        id: mockUser.id,
        type: PrincipalType.USER,
        platform: { id: ctx.platform.id },
    })
    return { token }
}

describe('POST /v1/mcp-oauth/approve access control', () => {
    it('lets a member holding READ_MCP authorize platform-wide', async () => {
        const ctx = await createTestContext(app)
        const { token } = await addMember({ ctx, permissions: [Permission.READ_FLOW, Permission.READ_MCP] })

        const response = await approveAs({ token })

        expect(response.statusCode).toBe(200)
    })

    it('refuses platform-wide authorization to a member holding READ_MCP nowhere', async () => {
        const ctx = await createTestContext(app)
        const { token } = await addMember({ ctx, permissions: [Permission.READ_FLOW] })

        const response = await approveAs({ token })

        expect(response.statusCode).toBe(403)
        expect(response.json().error_description).toContain('any project')
    })

    it('refuses a project whose role lacks READ_MCP, which bare membership used to allow', async () => {
        const ctx = await createTestContext(app)
        const { token } = await addMember({ ctx, permissions: [Permission.READ_FLOW, Permission.WRITE_FLOW] })

        const response = await approveAs({ token, projectId: ctx.project.id })

        expect(response.statusCode).toBe(403)
        expect(response.json().error_description).toContain('this project')
    })

    it('lets a member holding READ_MCP authorize their own project', async () => {
        const ctx = await createTestContext(app)
        const { token } = await addMember({ ctx, permissions: [Permission.READ_MCP] })

        const response = await approveAs({ token, projectId: ctx.project.id })

        expect(response.statusCode).toBe(200)
    })

    it('refuses an embedded user platform-wide authorization, even holding READ_MCP', async () => {
        const ctx = await createTestContext(app)
        const { token } = await addMember({
            ctx,
            permissions: [Permission.READ_FLOW, Permission.READ_MCP],
            provider: UserIdentityProvider.JWT,
        })

        const response = await approveAs({ token })

        expect(response.statusCode).toBe(403)
        expect(response.json().error_description).toContain('specific project')
    })

    it('still lets an embedded user authorize their own project', async () => {
        const ctx = await createTestContext(app)
        const { token } = await addMember({
            ctx,
            permissions: [Permission.READ_MCP],
            provider: UserIdentityProvider.JWT,
        })

        const response = await approveAs({ token, projectId: ctx.project.id })

        expect(response.statusCode).toBe(200)
    })

    it('lets the platform admin authorize platform-wide', async () => {
        const ctx = await createTestContext(app)

        const response = await approveAs({ token: ctx.token })

        expect(response.statusCode).toBe(200)
    })

    it('refuses a project the caller is not a member of', async () => {
        const ctx = await createTestContext(app)
        const other = await createTestContext(app)
        const { token } = await addMember({ ctx, permissions: [Permission.READ_MCP] })

        const response = await approveAs({ token, projectId: other.project.id })

        expect(response.statusCode).toBe(403)
    })

    it('refuses a default-role member whose platform grants no project', async () => {
        const ctx = await createTestContext(app)
        const { mockUser } = await mockBasicUser({
            user: { platformId: ctx.platform.id, platformRole: PlatformRole.MEMBER },
        })
        const token = await generateMockToken({
            id: mockUser.id,
            type: PrincipalType.USER,
            platform: { id: ctx.platform.id },
        })

        const response = await approveAs({ token })

        expect(response.statusCode).toBe(403)
    })

    it('lets a member on the default EDITOR role authorize platform-wide', async () => {
        const ctx = await createTestContext(app)
        const { mockUser } = await mockBasicUser({
            user: { platformId: ctx.platform.id, platformRole: PlatformRole.MEMBER },
        })
        const editorRole = await db.findOneByOrFail<{ id: string }>('project_role', { name: DefaultProjectRole.EDITOR })
        await db.save('project_member', createMockProjectMember({
            userId: mockUser.id,
            platformId: ctx.platform.id,
            projectId: ctx.project.id,
            projectRoleId: editorRole.id,
        }))
        const token = await generateMockToken({
            id: mockUser.id,
            type: PrincipalType.USER,
            platform: { id: ctx.platform.id },
        })

        const response = await approveAs({ token })

        expect(response.statusCode).toBe(200)
    })
})
