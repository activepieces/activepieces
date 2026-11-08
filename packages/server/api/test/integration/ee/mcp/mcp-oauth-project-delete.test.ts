import { DefaultProjectRole, McpOAuthToken, PlatformRole } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { platformProjectService } from '../../../../src/app/ee/projects/platform-project-service'
import { projectMemberService } from '../../../../src/app/ee/projects/project-members/project-member.service'
import { scimGroupService } from '../../../../src/app/ee/scim/scim-group-service'
import { mcpOAuthCodeService } from '../../../../src/app/mcp/oauth/code/mcp-oauth-code.service'
import { mcpGrantRevocation } from '../../../../src/app/mcp/oauth/token/mcp-grant-revocation'
import { mcpOAuthRevocationList } from '../../../../src/app/mcp/oauth/token/mcp-oauth-revocation-list'
import { mcpOAuthTokenService, OAuthTokenError } from '../../../../src/app/mcp/oauth/token/mcp-oauth-token.service'
import { db } from '../../../helpers/db'
import { MCP_OAUTH_REDIRECT_URI, McpGrantee, mcpOAuthTestHelpers } from '../../../helpers/mcp-oauth'
import { mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterEach(() => {
    vi.restoreAllMocks()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('MCP OAuth grants on project delete', () => {
    it('revokes the project\'s grants and voids its unused codes once it is deleted', async () => {
        const grantee = await createProjectOwner()
        const grant = await mcpOAuthTestHelpers.exchangeGrant(grantee)
        const isCodeUsable = await issueUnusedCode(grantee)

        await platformProjectService(app.log).markForDeletion({ id: grantee.projectId, platformId: grantee.platformId })

        expect((await db.findOneBy<McpOAuthToken>('mcp_oauth_token', { id: grant.grantId }))?.revoked).toBe(true)
        expect(await mcpOAuthRevocationList.isRevoked({ grantId: grant.grantId })).toBe(true)
        await expect(refresh(grant)).rejects.toBeInstanceOf(OAuthTokenError)
        expect(await isCodeUsable()).toBe(false)
    })

    it('still deletes the project when revoking its grants fails', async () => {
        const grantee = await createProjectOwner()
        await mcpOAuthTestHelpers.exchangeGrant(grantee)
        vi.spyOn(mcpOAuthRevocationList, 'revoke').mockRejectedValue(new Error('redis down'))

        await expect(platformProjectService(app.log).markForDeletion({ id: grantee.projectId, platformId: grantee.platformId })).resolves.toBeUndefined()
    })

    it('refuses the tokens of a deleted project even when its revocation was not written', async () => {
        const grantee = await createProjectOwner()
        const grant = await mcpOAuthTestHelpers.exchangeGrant(grantee)
        vi.spyOn(mcpGrantRevocation, 'revokeActiveGrants').mockResolvedValue(undefined)

        await platformProjectService(app.log).markForDeletion({ id: grantee.projectId, platformId: grantee.platformId })

        await expect(refresh(grant)).rejects.toBeInstanceOf(OAuthTokenError)
        expect((await mcpOAuthTestHelpers.callMcp({ app, accessToken: grant.accessToken })).statusCode).toBe(401)
    })

    it('refuses to issue tokens for a project that was deleted', async () => {
        const grantee = await createProjectOwner()
        await platformProjectService(app.log).markForDeletion({ id: grantee.projectId, platformId: grantee.platformId })

        await expect(mcpOAuthTestHelpers.exchangeGrant(grantee)).rejects.toBeInstanceOf(OAuthTokenError)
    })
})

describe('MCP OAuth grants on project member removal', () => {
    it.each([
        { removal: 'removed from the project', remove: ({ ctx, membershipId }: RemovalParams): Promise<unknown> => projectMemberService(app.log).removeFromProject({ projectId: ctx.project.id, memberId: membershipId, enforceLastProjectGuard: false }) },
        { removal: 'removed from its SCIM group', remove: ({ ctx, userId }: RemovalParams): Promise<unknown> => scimGroupService(app.log).patch({
            platformId: ctx.platform.id,
            projectId: ctx.project.id,
            request: { schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'], Operations: [{ op: 'remove', path: `members[value eq "${userId}"]` }] },
        }) },
    ])('ends a member\'s sign-ins for the project once $removal, and keeps their other sign-ins', async ({ remove }) => {
        const { ctx, member, membershipId } = await createEditor()
        const grantee = { userId: member.user.id, projectId: ctx.project.id, platformId: ctx.platform.id }
        const projectGrant = await mcpOAuthTestHelpers.exchangeGrant(grantee)
        const platformGrant = await mcpOAuthTestHelpers.exchangeGrant({ ...grantee, projectId: null })
        const isCodeUsable = await issueUnusedCode(grantee)

        await remove({ ctx, userId: member.user.id, membershipId })

        await expect(refresh(projectGrant)).rejects.toBeInstanceOf(OAuthTokenError)
        expect(await isCodeUsable()).toBe(false)
        await expect(refresh(platformGrant)).resolves.toHaveProperty('access_token')
    })

    it('keeps the sign-in of a platform admin whose membership row is removed, since they keep access', async () => {
        const { ctx, member, membershipId } = await createEditor()
        await db.update('user', member.user.id, { platformRole: PlatformRole.ADMIN })
        const projectGrant = await mcpOAuthTestHelpers.exchangeGrant({ userId: member.user.id, projectId: ctx.project.id, platformId: ctx.platform.id })

        await projectMemberService(app.log).delete(ctx.project.id, membershipId)

        await expect(refresh(projectGrant)).resolves.toHaveProperty('access_token')
    })

    it('still removes the member when revoking their sign-ins fails', async () => {
        const { ctx, member, membershipId } = await createEditor()
        await mcpOAuthTestHelpers.exchangeGrant({ userId: member.user.id, projectId: ctx.project.id, platformId: ctx.platform.id })
        vi.spyOn(mcpOAuthRevocationList, 'revoke').mockRejectedValue(new Error('redis down'))

        await expect(projectMemberService(app.log).delete(ctx.project.id, membershipId)).resolves.toBeUndefined()
    })
})

async function createProjectOwner(): Promise<McpGrantee & { projectId: string }> {
    const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup()
    return { userId: mockOwner.id, projectId: mockProject.id, platformId: mockPlatform.id }
}

async function createEditor(): Promise<{ ctx: TestContext, member: TestContext, membershipId: string }> {
    const ctx = await createTestContext(app)
    const member = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.EDITOR })
    const membership = await db.findOneByOrFail<{ id: string }>('project_member', { userId: member.user.id, projectId: ctx.project.id })
    return { ctx, member, membershipId: membership.id }
}

async function issueUnusedCode(grantee: McpGrantee): Promise<() => Promise<boolean>> {
    const clientId = 'project-delete-test-client'
    const code = await mcpOAuthTestHelpers.issueCode({ clientId, codeChallenge: 'challenge', ...grantee })
    return async () => (await mcpOAuthCodeService.consume({ code, clientId, redirectUri: MCP_OAUTH_REDIRECT_URI })) !== null
}

function refresh({ clientId, refreshToken }: { clientId: string, refreshToken: string }): ReturnType<typeof mcpOAuthTokenService.refreshAccessToken> {
    return mcpOAuthTokenService.refreshAccessToken({ redirectUris: [MCP_OAUTH_REDIRECT_URI], refreshToken, clientId, log: app.log })
}

type RemovalParams = {
    ctx: TestContext
    userId: string
    membershipId: string
}
