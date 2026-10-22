import { AgentIcon, AgentToolType, AppConnection, AppConnectionReplaceScope, ColorName } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { db } from '../../../helpers/db'
import { createMockConnection, createMockFlow, createMockFlowVersion } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

const PIECE_NAME = '@activepieces/piece-slack'

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function context(): Promise<TestContext> {
    return createTestContext(app, { plan: { agentsEnabled: true } })
}

async function saveConnections(ctx: TestContext) {
    const source = createMockConnection({ platformId: ctx.platform.id, projectIds: [ctx.project.id], pieceName: PIECE_NAME }, ctx.user.id)
    const target = createMockConnection({ platformId: ctx.platform.id, projectIds: [ctx.project.id], pieceName: PIECE_NAME }, ctx.user.id)
    const other = createMockConnection({ platformId: ctx.platform.id, projectIds: [ctx.project.id], pieceName: PIECE_NAME }, ctx.user.id)
    await db.save('app_connection', [source, target, other])
    return { source, target, other }
}

function pieceTool({ toolName, auth }: { toolName: string, auth: string }) {
    return {
        type: AgentToolType.PIECE,
        toolName,
        pieceMetadata: {
            pieceName: PIECE_NAME,
            pieceVersion: '0.0.1',
            actionName: 'send_message',
            predefinedInput: { auth, fields: {} },
        },
    }
}

function config(tools: ReturnType<typeof pieceTool>[]) {
    return { instructions: 'Post updates.', provider: null, providerConfigId: null, modelName: null, modelTierId: null, maxSteps: 5, tools, structuredOutput: [] }
}

async function createAgent({ ctx, draftAuth, publishedAuth }: { ctx: TestContext, draftAuth: string[], publishedAuth: string[] | null }): Promise<string> {
    const response = await ctx.post('/v1/agents', {
        projectId: ctx.project.id,
        displayName: 'Slack agent',
        icon: AgentIcon.SPARKLES,
        color: ColorName.PURPLE,
        draft: config([]),
    })
    expect(response.statusCode).toBe(StatusCodes.CREATED)
    const agentId: string = response.json().id
    const toTools = (auths: string[]) => auths.map((auth, index) => pieceTool({ toolName: `slack_${index}`, auth }))
    await db.update('agent', agentId, {
        draft: config(toTools(draftAuth)),
        published: publishedAuth === null ? null : config(toTools(publishedAuth)),
    })
    return agentId
}

async function toolAuths(agentId: string): Promise<{ draft: (string | undefined)[], published: (string | undefined)[] | undefined }> {
    const row = await db.findOneByOrFail<{ draft: ReturnType<typeof config>, published: ReturnType<typeof config> | null }>('agent', { id: agentId })
    return {
        draft: row.draft.tools.map((tool) => tool.pieceMetadata.predefinedInput.auth),
        published: row.published?.tools.map((tool) => tool.pieceMetadata.predefinedInput.auth),
    }
}

describe('listing the agents that use a connection', () => {
    it('returns the agents whose draft or published tools use the connection', async () => {
        const ctx = await context()
        const { source, other } = await saveConnections(ctx)
        const draftAgentId = await createAgent({ ctx, draftAuth: [`{{connections['${source.externalId}']}}`], publishedAuth: null })
        const publishedAgentId = await createAgent({ ctx, draftAuth: [other.externalId], publishedAuth: [source.externalId] })
        await createAgent({ ctx, draftAuth: [other.externalId], publishedAuth: null })

        const response = await ctx.get('/v1/agents', { projectId: ctx.project.id, connectionExternalIds: [source.externalId] })

        expect(response.statusCode).toBe(StatusCodes.OK)
        const agentIds: string[] = response.json().data.map((agent: { id: string }) => agent.id)
        expect(agentIds.sort()).toEqual([draftAgentId, publishedAgentId].sort())
    })
})

describe('replacing a connection in saved agents', () => {
    it('changes the draft tools in the project, and keeps the published tools', async () => {
        const ctx = await context()
        const { source, target, other } = await saveConnections(ctx)
        const agentId = await createAgent({
            ctx,
            draftAuth: [source.externalId, `{{connections['${source.externalId}']}}`, other.externalId],
            publishedAuth: [source.externalId],
        })

        const response = await ctx.post('/v1/app-connections/replace', {
            sourceAppConnectionId: source.id,
            targetAppConnectionId: target.id,
            projectId: ctx.project.id,
        })

        expect(response.statusCode).toBe(StatusCodes.NO_CONTENT)
        expect(await toolAuths(agentId)).toEqual({
            draft: [target.externalId, target.externalId, other.externalId],
            published: [source.externalId],
        })
    })

    it('also changes the published tools with applyToPublishedVersions, and can then delete the old connection', async () => {
        const ctx = await context()
        const { source, target } = await saveConnections(ctx)
        const agentId = await createAgent({ ctx, draftAuth: [source.externalId], publishedAuth: [source.externalId] })

        const response = await ctx.post('/v1/app-connections/replace', {
            sourceAppConnectionId: source.id,
            targetAppConnectionId: target.id,
            projectId: ctx.project.id,
            applyToPublishedVersions: true,
            deleteSourceConnection: true,
        })

        expect(response.statusCode).toBe(StatusCodes.NO_CONTENT)
        expect(await toolAuths(agentId)).toEqual({ draft: [target.externalId], published: [target.externalId] })
        expect(await db.findOneBy<AppConnection>('app_connection', { id: source.id })).toBeNull()
    })

    it('refuses to delete the old connection while a published agent that is not updated uses it', async () => {
        const ctx = await context()
        const { source, target } = await saveConnections(ctx)
        const agentId = await createAgent({ ctx, draftAuth: [], publishedAuth: [source.externalId] })

        const response = await ctx.post('/v1/app-connections/replace', {
            sourceAppConnectionId: source.id,
            targetAppConnectionId: target.id,
            projectId: ctx.project.id,
            deleteSourceConnection: true,
        })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(response.json().params.message).toContain('published agents')
        expect(await toolAuths(agentId)).toEqual({ draft: [], published: [source.externalId] })
        expect(await db.findOneBy<AppConnection>('app_connection', { id: source.id })).not.toBeNull()
    })

    it('does not change saved agents when the replace is for one flow', async () => {
        const ctx = await context()
        const { source, target } = await saveConnections(ctx)
        const agentId = await createAgent({ ctx, draftAuth: [source.externalId], publishedAuth: null })
        const flow = createMockFlow({ projectId: ctx.project.id })
        await db.save('flow', flow)
        await db.save('flow_version', createMockFlowVersion({ flowId: flow.id }))

        const response = await ctx.post('/v1/app-connections/replace', {
            scope: AppConnectionReplaceScope.FLOW,
            flowIds: [flow.id],
            sourceAppConnectionId: source.id,
            targetAppConnectionId: target.id,
            projectId: ctx.project.id,
        })

        expect(response.statusCode).toBe(StatusCodes.NO_CONTENT)
        expect(await toolAuths(agentId)).toEqual({ draft: [source.externalId], published: undefined })
    })
})
