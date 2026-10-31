import { DefaultProjectRole, ProjectMember, UserStatus } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../helpers/db'
import { mcpClientHelpers, PROJECT_RESOURCE } from '../../../helpers/mcp-client'
import { MCP_OAUTH_REDIRECT_URI, mcpOAuthTestHelpers } from '../../../helpers/mcp-oauth'
import { createMockFlow, createMockFlowVersion, createMockProject, createMockProjectMember } from '../../../helpers/mocks'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function connectToProject({ member, projectId }: { member: TestContext, projectId: string }) {
    const client = await mcpOAuthTestHelpers.registerClient({ app, tokenEndpointAuthMethod: 'none' })
    const { verifier, challenge } = mcpOAuthTestHelpers.generatePkce()
    const consent = await app.inject({
        method: 'GET',
        url: '/authorize?' + new URLSearchParams({
            client_id: client.client_id,
            redirect_uri: MCP_OAUTH_REDIRECT_URI,
            response_type: 'code',
            code_challenge: challenge,
            code_challenge_method: 'S256',
            scope: 'mcp',
            resource: PROJECT_RESOURCE,
        }).toString(),
    })
    const authRequestId = new URL(String(consent.headers.location), MCP_OAUTH_REDIRECT_URI).searchParams.get('authRequestId') ?? ''
    const approved = await member.post('/v1/mcp-oauth/approve', { authRequestId, projectId })
    expect(approved.statusCode).toBe(StatusCodes.OK)
    const code = new URL(approved.json().redirectUrl).searchParams.get('code') ?? ''
    const token = await app.inject({
        method: 'POST',
        url: '/token',
        payload: {
            grant_type: 'authorization_code',
            client_id: client.client_id,
            code,
            code_verifier: verifier,
            redirect_uri: MCP_OAUTH_REDIRECT_URI,
        },
    })
    expect(token.statusCode).toBe(StatusCodes.OK)
    return { clientId: client.client_id, accessToken: token.json().access_token, refreshToken: token.json().refresh_token }
}

function listTools(accessToken: string) {
    return app.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
            'authorization': `Bearer ${accessToken}`,
            'content-type': 'application/json',
            'accept': 'application/json, text/event-stream',
        },
        payload: { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} },
    })
}

function refresh({ clientId, refreshToken }: { clientId: string, refreshToken: string }) {
    return app.inject({
        method: 'POST',
        url: '/token',
        payload: { grant_type: 'refresh_token', client_id: clientId, refresh_token: refreshToken },
    })
}

async function setup() {
    const owner = await createTestContext(app, { plan: { projectRolesEnabled: true } })
    const member = await createMemberContext(app, owner, { projectRole: DefaultProjectRole.EDITOR })
    const membership = await db.findOneByOrFail<ProjectMember>('project_member', { userId: member.user.id, projectId: owner.project.id })
    const otherProject = createMockProject({ platformId: owner.platform.id, ownerId: owner.user.id })
    await db.save('project', otherProject)
    await db.save('project_member', createMockProjectMember({ userId: member.user.id, projectId: otherProject.id, platformId: owner.platform.id, projectRoleId: membership.projectRoleId }))
    const flowName = `qa-private-flow-${Date.now()}`
    const flow = createMockFlow({ projectId: owner.project.id })
    await db.save('flow', flow)
    await db.save('flow_version', createMockFlowVersion({ flowId: flow.id, displayName: flowName }))
    const grant = await connectToProject({ member, projectId: owner.project.id })
    expect((await listTools(grant.accessToken)).statusCode).toBe(StatusCodes.OK)
    const listed = await mcpClientHelpers.callTool({ app, mcpClient: { accessToken: grant.accessToken, endpoint: '/mcp' }, name: 'ap_list_flows' })
    expect(listed).toContain(flowName)
    return { owner, member, grant, flowName }
}

describe('MCP OAuth grant of a person who lost access', () => {
    it('removed from the project: the project MCP server refuses the old and a refreshed token', async () => {
        const { owner, member, grant } = await setup()
        const membership = await db.findOneByOrFail<{ id: string }>('project_member', { userId: member.user.id, projectId: owner.project.id })
        expect((await owner.delete(`/v1/project-members/${membership.id}`)).statusCode).toBe(StatusCodes.NO_CONTENT)

        const refreshed = await refresh(grant)
        const tokens = [grant.accessToken, refreshed.json().access_token]
        const responses = await Promise.all(tokens.map((accessToken) => listTools(accessToken)))

        expect(responses.map((response) => response.statusCode)).toEqual([StatusCodes.UNAUTHORIZED, StatusCodes.UNAUTHORIZED])
    })

    it('deactivated by the platform admin: the grant can no longer read the project', async () => {
        const { owner, member, grant, flowName } = await setup()
        const deactivated = await owner.post(`/v1/users/${member.user.id}`, { status: UserStatus.INACTIVE })
        expect(deactivated.statusCode).toBe(StatusCodes.OK)
        expect((await member.get('/v1/flows', { projectId: owner.project.id })).statusCode).not.toBe(StatusCodes.OK)

        const refreshed = await refresh(grant)
        const newToken = refreshed.statusCode === StatusCodes.OK ? refreshed.json().access_token : grant.accessToken
        const listed = await mcpClientHelpers.callTool({ app, mcpClient: { accessToken: newToken, endpoint: '/mcp' }, name: 'ap_list_flows' }).catch(() => '')

        expect(listed).not.toContain(flowName)
    })
})
