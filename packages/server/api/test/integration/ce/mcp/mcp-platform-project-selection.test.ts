import { FlowStatus, FlowVersionState, Project } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { beforeAll, describe, expect, it } from 'vitest'
import { db } from '../../../helpers/db'
import { MCP_OAUTH_REDIRECT_URI, mcpOAuthTestHelpers } from '../../../helpers/mcp-oauth'
import { createMockFlow, createMockFlowVersion, createMockProject } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
let ctx: TestContext
let secondProject: Project

const PLATFORM_RESOURCE = 'https://cloud.activepieces.com/mcp/platform'
const FLOW_IN_FIRST_PROJECT = 'flow-in-first-project'
const FLOW_IN_SECOND_PROJECT = 'flow-in-second-project'

async function connectPlatformWideClient(): Promise<string> {
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
            resource: PLATFORM_RESOURCE,
        }).toString(),
    })
    expect(consent.statusCode).toBe(302)

    const authRequestId = new URL(String(consent.headers.location), MCP_OAUTH_REDIRECT_URI).searchParams.get('authRequestId') ?? ''
    const approved = await ctx.post('/v1/mcp-oauth/approve', { authRequestId })
    expect(approved.statusCode).toBe(200)

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
    expect(token.statusCode).toBe(200)
    return token.json().access_token
}

async function callTool({ accessToken, name, args }: {
    accessToken: string
    name: string
    args?: Record<string, unknown>
}): Promise<string> {
    const res = await app.inject({
        method: 'POST',
        url: '/mcp/platform',
        headers: {
            'authorization': `Bearer ${accessToken}`,
            'content-type': 'application/json',
            'accept': 'application/json, text/event-stream',
        },
        payload: {
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/call',
            params: { name, arguments: args ?? {} },
        },
    })
    expect(res.statusCode).toBe(200)
    return toolResultText(res.body)
}

function toolResultText(body: string): string {
    const dataLine = body.split('\n').find((line) => line.startsWith('data: '))
    const payload = dataLine ? dataLine.slice('data: '.length) : body
    const message: JsonRpcToolResponse = JSON.parse(payload)
    return (message.result?.content ?? []).map((part) => part.text ?? '').join('\n')
}

async function seedFlow({ projectId, displayName }: { projectId: string, displayName: string }): Promise<void> {
    const flow = createMockFlow({ projectId, status: FlowStatus.DISABLED })
    await db.save('flow', flow)
    await db.save('flow_version', createMockFlowVersion({
        flowId: flow.id,
        updatedBy: ctx.user.id,
        state: FlowVersionState.DRAFT,
        valid: true,
        displayName,
    }))
}

describe('platform MCP project selection', () => {
    beforeAll(async () => {
        app = await setupTestEnvironment()
        ctx = await createTestContext(app)

        secondProject = createMockProject({
            platformId: ctx.platform.id,
            ownerId: ctx.user.id,
            displayName: 'second-project',
        })
        await db.save('project', secondProject)

        await seedFlow({ projectId: ctx.project.id, displayName: FLOW_IN_FIRST_PROJECT })
        await seedFlow({ projectId: secondProject.id, displayName: FLOW_IN_SECOND_PROJECT })
    })

    it('keeps each connected client on its own selected project', async () => {
        const firstClient = await connectPlatformWideClient()
        const secondClient = await connectPlatformWideClient()

        await callTool({ accessToken: firstClient, name: 'ap_set_project_context', args: { projectId: ctx.project.id } })
        await callTool({ accessToken: secondClient, name: 'ap_set_project_context', args: { projectId: secondProject.id } })

        const listedByFirst = await callTool({ accessToken: firstClient, name: 'ap_list_flows' })
        const listedBySecond = await callTool({ accessToken: secondClient, name: 'ap_list_flows' })

        expect(listedByFirst).toContain(FLOW_IN_FIRST_PROJECT)
        expect(listedByFirst).not.toContain(FLOW_IN_SECOND_PROJECT)
        expect(listedBySecond).toContain(FLOW_IN_SECOND_PROJECT)
        expect(listedBySecond).not.toContain(FLOW_IN_FIRST_PROJECT)
    })

    it('asks a client with no selection of its own to pick a project', async () => {
        const alreadySelectedClient = await connectPlatformWideClient()
        await callTool({ accessToken: alreadySelectedClient, name: 'ap_set_project_context', args: { projectId: ctx.project.id } })

        const freshClient = await connectPlatformWideClient()
        const listedByFresh = await callTool({ accessToken: freshClient, name: 'ap_list_flows' })

        expect(listedByFresh).toContain('No project selected')
    })
})

type JsonRpcToolResponse = {
    result?: {
        content?: { text?: string }[]
    }
}
