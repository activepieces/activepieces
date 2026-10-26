import { createHash, randomBytes } from 'crypto'
import { DefaultProjectRole, Platform, PlatformRole, Project } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { platformProjectService } from '../../../../src/app/ee/projects/platform-project-service'
import { projectMemberService } from '../../../../src/app/ee/projects/project-members/project-member.service'
import { mcpOAuthClientService } from '../../../../src/app/mcp/oauth/client/mcp-oauth-client.service'
import { mcpGrantRevocation } from '../../../../src/app/mcp/oauth/token/mcp-grant-revocation'
import { mcpOAuthRevocationList } from '../../../../src/app/mcp/oauth/token/mcp-oauth-revocation-list'
import { mcpOAuthTokenService, OAuthTokenError } from '../../../../src/app/mcp/oauth/token/mcp-oauth-token.service'
import { db } from '../../../helpers/db'
import { mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { createMemberContext, createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

const REDIRECT_URI = 'https://claude.ai/api/mcp/auth_callback'

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
    it('stops refreshing a grant once its project is deleted', async () => {
        const { mockPlatform, mockProject, clientId, refreshToken } = await createProjectGrant()

        await platformProjectService(app.log).markForDeletion({ id: mockProject.id, platformId: mockPlatform.id })

        await expect(mcpOAuthTokenService.refreshAccessToken({
            redirectUris: [REDIRECT_URI],
            refreshToken,
            clientId,
            log: app.log,
        })).rejects.toBeInstanceOf(OAuthTokenError)
    })

    it('still deletes the project when revoking its grants fails', async () => {
        const { mockPlatform, mockProject } = await createProjectGrant()
        vi.spyOn(mcpOAuthRevocationList, 'revoke').mockRejectedValue(new Error('redis down'))

        await expect(platformProjectService(app.log).markForDeletion({ id: mockProject.id, platformId: mockPlatform.id })).resolves.toBeUndefined()
    })

    it('refuses to refresh a grant of a deleted project even when its revocation was not written', async () => {
        const { mockPlatform, mockProject, clientId, refreshToken } = await createProjectGrant()
        vi.spyOn(mcpGrantRevocation, 'revokeActiveGrants').mockResolvedValue(undefined)

        await platformProjectService(app.log).markForDeletion({ id: mockProject.id, platformId: mockPlatform.id })

        await expect(refresh({ clientId, refreshToken })).rejects.toBeInstanceOf(OAuthTokenError)
    })

    it('refuses an access token for a deleted project even when its revocation was not written', async () => {
        const { mockPlatform, mockProject, accessToken } = await createProjectGrant()
        vi.spyOn(mcpOAuthRevocationList, 'revoke').mockRejectedValue(new Error('redis down'))
        await platformProjectService(app.log).markForDeletion({ id: mockProject.id, platformId: mockPlatform.id })

        const response = await app.inject({
            method: 'POST',
            url: '/mcp',
            headers: { 'authorization': `Bearer ${accessToken}`, 'content-type': 'application/json', 'accept': 'application/json, text/event-stream' },
            payload: { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} },
        })

        expect(response.statusCode).toBe(401)
    })

    it('refuses to issue tokens for a project that was deleted', async () => {
        const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup()
        await platformProjectService(app.log).markForDeletion({ id: mockProject.id, platformId: mockPlatform.id })

        await expect(exchangeGrant({ userId: mockOwner.id, projectId: mockProject.id, platformId: mockPlatform.id })).rejects.toBeInstanceOf(OAuthTokenError)
    })
})

describe('MCP OAuth grants on project member removal', () => {
    it('ends the member\'s sign-in for that project and keeps their other sign-ins', async () => {
        const ctx = await createTestContext(app)
        const member = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.EDITOR })
        const projectGrant = await exchangeGrant({ userId: member.user.id, projectId: ctx.project.id, platformId: ctx.platform.id })
        const platformGrant = await exchangeGrant({ userId: member.user.id, projectId: null, platformId: ctx.platform.id })
        const membership = await db.findOneByOrFail<{ id: string }>('project_member', { userId: member.user.id, projectId: ctx.project.id })

        await projectMemberService(app.log).delete(ctx.project.id, membership.id)

        await expect(refresh(projectGrant)).rejects.toBeInstanceOf(OAuthTokenError)
        await expect(refresh(platformGrant)).resolves.toHaveProperty('access_token')
    })

    it('keeps the sign-in of a platform admin whose membership row is removed, since they keep access', async () => {
        const ctx = await createTestContext(app)
        const member = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.EDITOR })
        await db.update('user', member.user.id, { platformRole: PlatformRole.ADMIN })
        const projectGrant = await exchangeGrant({ userId: member.user.id, projectId: ctx.project.id, platformId: ctx.platform.id })
        const membership = await db.findOneByOrFail<{ id: string }>('project_member', { userId: member.user.id, projectId: ctx.project.id })

        await projectMemberService(app.log).delete(ctx.project.id, membership.id)

        await expect(refresh(projectGrant)).resolves.toHaveProperty('access_token')
    })

    it('still removes the member when revoking their sign-ins fails', async () => {
        const ctx = await createTestContext(app)
        const member = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.EDITOR })
        await exchangeGrant({ userId: member.user.id, projectId: ctx.project.id, platformId: ctx.platform.id })
        const membership = await db.findOneByOrFail<{ id: string }>('project_member', { userId: member.user.id, projectId: ctx.project.id })
        vi.spyOn(mcpOAuthRevocationList, 'revoke').mockRejectedValue(new Error('redis down'))

        await expect(projectMemberService(app.log).delete(ctx.project.id, membership.id)).resolves.toBeUndefined()
    })
})

async function createProjectGrant(): Promise<{ mockPlatform: Platform, mockProject: Project, clientId: string, refreshToken: string, accessToken: string }> {
    const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup()
    const { clientId, refreshToken, accessToken } = await exchangeGrant({ userId: mockOwner.id, projectId: mockProject.id, platformId: mockPlatform.id })
    return { mockPlatform, mockProject, clientId, refreshToken, accessToken }
}

async function exchangeGrant({ userId, projectId, platformId }: { userId: string, projectId: string | null, platformId: string }): Promise<{ clientId: string, refreshToken: string, accessToken: string }> {
    const { client_id: clientId } = await mcpOAuthClientService.register({ redirectUris: [REDIRECT_URI], tokenEndpointAuthMethod: 'none' })
    const codeVerifier = randomBytes(32).toString('base64url')
    const { refresh_token: refreshToken, access_token: accessToken } = await mcpOAuthTokenService.exchangeCode({
        redirectUris: [REDIRECT_URI],
        codeVerifier,
        codeChallenge: createHash('sha256').update(codeVerifier).digest('base64url'),
        codeChallengeMethod: 'S256',
        clientId,
        userId,
        projectId,
        platformId,
        scopes: ['mcp'],
    })
    if (refreshToken === undefined) {
        throw new Error('expected exchangeCode to return a refresh token')
    }
    return { clientId, refreshToken, accessToken }
}

function refresh({ clientId, refreshToken }: { clientId: string, refreshToken: string }): ReturnType<typeof mcpOAuthTokenService.refreshAccessToken> {
    return mcpOAuthTokenService.refreshAccessToken({ redirectUris: [REDIRECT_URI], refreshToken, clientId, log: app.log })
}
