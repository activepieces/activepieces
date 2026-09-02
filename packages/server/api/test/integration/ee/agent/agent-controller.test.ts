import { AIProviderName, apId, Permission, RoleType } from '@activepieces/core-utils'
import { AgentIcon, AgentRunSource, AgentVisibility, ColorName, DEFAULT_AGENT_MAX_STEPS, DefaultProjectRole, FlowStatus, FlowVersionState, MAX_DRAFT_PROMPT_LENGTH } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../helpers/db'
import { createMockFlow, createMockFlowVersion, createMockProjectRole, mockAndSaveAIProvider } from '../../../helpers/mocks'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { DRAFTS_PER_MINUTE } from '../../../../src/app/ee/agent/agent-controller'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

const agentBody = (projectId: string, overrides: Record<string, unknown> = {}) => ({
    projectId,
    displayName: 'Marketing agent',
    icon: AgentIcon.SPARKLES,
    color: ColorName.PURPLE,
    draft: {
        instructions: 'Draft launch posts.',
        provider: null,
        modelName: null,
        maxSteps: 5,
        tools: [],
        structuredOutput: [],
    },
    ...overrides,
})

async function context(): Promise<TestContext> {
    return createTestContext(app, { plan: { agentsEnabled: true } })
}

async function createAgent(ctx: TestContext, overrides: Record<string, unknown> = {}) {
    const response = await ctx.post('/v1/agents', agentBody(ctx.project.id, overrides))
    expect(response.statusCode).toBe(StatusCodes.CREATED)
    return response.json()
}

async function publishFlowRunningAgent({ projectId, externalId, displayName, publish = true }: { projectId: string, externalId: string, displayName: string, publish?: boolean }): Promise<void> {
    const flow = createMockFlow({ projectId, status: FlowStatus.ENABLED })
    await db.save('flow', flow)
    const version = createMockFlowVersion({
        flowId: flow.id,
        displayName,
        state: FlowVersionState.LOCKED,
        agentIds: [externalId],
    })
    await db.save('flow_version', version)
    if (publish) {
        await db.update('flow', flow.id, { publishedVersionId: version.id })
    }
}

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('agent crud', () => {
    it('fills in the platform model when the request names none', async () => {
        const ctx = await context()
        await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENROUTER, enabledForChat: true })

        const agent = await createAgent(ctx)

        expect(agent.draft.modelName).toBe('anthropic/claude-sonnet-4.6')
        expect(agent.draft.provider).toBe(AIProviderName.OPENROUTER)
    })

    it('keeps a model the request did name, even where a default was available', async () => {
        const ctx = await context()
        await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENROUTER, enabledForChat: true })

        const agent = await createAgent(ctx, { draft: { ...agentBody(ctx.project.id).draft, provider: AIProviderName.OPENROUTER, modelName: 'anthropic/claude-haiku-4.5' } })

        expect(agent.draft.modelName).toBe('anthropic/claude-haiku-4.5')
    })

    it('leaves the model empty where the platform has no chat provider', async () => {
        const ctx = await context()

        const agent = await createAgent(ctx)

        expect(agent.draft.modelName).toBeNull()
    })

    it('creates an agent owned by the caller, in draft, unpublished', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)

        expect(agent.ownerId).toBe(ctx.user.id)
        expect(agent.projectId).toBe(ctx.project.id)
        expect(agent.visibility).toBe(AgentVisibility.PROJECT)
        expect(agent.published).toBeNull()
        expect(agent.draft.instructions).toBe('Draft launch posts.')
    })

    it('updates only the fields the request names', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)

        const response = await ctx.post(`/v1/agents/${agent.id}`, { displayName: 'Renamed' })

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json().displayName).toBe('Renamed')
        expect(response.json().draft.instructions).toBe('Draft launch posts.')
    })

    it('deletes an agent', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)

        expect((await ctx.delete(`/v1/agents/${agent.id}`)).statusCode).toBe(StatusCodes.NO_CONTENT)
        expect((await ctx.get(`/v1/agents/${agent.id}`)).statusCode).toBe(StatusCodes.NOT_FOUND)
    })

    it('tells you which published flows use an agent before you try to delete it', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        await publishFlowRunningAgent({ projectId: ctx.project.id, externalId: agent.externalId, displayName: 'Nightly digest' })

        const withUsage = (await ctx.get(`/v1/agents/${agent.id}`, { includeUsage: 'true' })).json()
        const withoutUsage = (await ctx.get(`/v1/agents/${agent.id}`)).json()

        expect(withUsage.publishedFlowsUsingAgent).toStrictEqual({ total: 1, names: ['Nightly digest'] })
        expect(withoutUsage.publishedFlowsUsingAgent).toBeUndefined()
    })

    it('reports no usage for an agent no published flow runs', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)

        const response = await ctx.get(`/v1/agents/${agent.id}`, { includeUsage: 'true' })

        expect(response.json().publishedFlowsUsingAgent).toStrictEqual({ total: 0, names: [] })
    })

    it('refuses an editor who did not create the agent, because deleting takes other people\'s conversations with it', async () => {
        const owner = await context()
        const editor = await createMemberContext(app, owner, { projectRole: DefaultProjectRole.EDITOR })
        const agent = await createAgent(owner)

        expect((await editor.delete(`/v1/agents/${agent.id}`)).statusCode).toBe(StatusCodes.FORBIDDEN)
        expect((await owner.get(`/v1/agents/${agent.id}`)).statusCode).toBe(StatusCodes.OK)
    })

    it('takes the conversations held with the agent, whoever held them', async () => {
        const owner = await context()
        const editor = await createMemberContext(app, owner, { projectRole: DefaultProjectRole.EDITOR })
        const agent = await createAgent(owner)
        const conversations = [owner, editor].map((ctx) => ({
            id: apId(),
            platformId: owner.platform.id,
            projectId: owner.project.id,
            userId: ctx.user.id,
            agentId: agent.id,
            source: AgentRunSource.AGENT,
            messages: [],
            uiMessages: [],
        }))
        await db.save('agent_conversation', conversations)

        expect((await owner.delete(`/v1/agents/${agent.id}`)).statusCode).toBe(StatusCodes.NO_CONTENT)
        for (const conversation of conversations) {
            expect(await db.findOneBy('agent_conversation', { id: conversation.id })).toBeNull()
        }
    })

    it('refuses to delete an agent a published flow still runs, and names the flow', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        await publishFlowRunningAgent({ projectId: ctx.project.id, externalId: agent.externalId, displayName: 'Nightly digest' })

        const response = await ctx.delete(`/v1/agents/${agent.id}`)

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(JSON.stringify(response.json())).toContain('Nightly digest')
        expect((await ctx.get(`/v1/agents/${agent.id}`)).statusCode).toBe(StatusCodes.OK)
    })

    it('names three flows and stops counting, so the refusal cannot grow without bound', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        const externalId = agent.externalId
        for (const name of ['Flow A', 'Flow B', 'Flow C', 'Flow D', 'Flow E']) {
            await publishFlowRunningAgent({ projectId: ctx.project.id, externalId, displayName: name })
        }

        const message = JSON.stringify((await ctx.delete(`/v1/agents/${agent.id}`)).json())

        expect(message).toContain('5 published flows (Flow A, Flow B, Flow C, and 2 more)')
        expect(message).not.toContain('Flow D')
    })

    it('counts the flows instead of naming them for a caller who cannot read flows', async () => {
        const owner = await context()
        const role = createMockProjectRole({
            platformId: owner.platform.id,
            name: `agent-writer-${apId()}`,
            type: RoleType.CUSTOM,
            permissions: [Permission.READ_AGENT, Permission.WRITE_AGENT],
        })
        await db.save('project_role', role)
        const writer = await createMemberContext(app, owner, { projectRole: role.name })
        const agent = await createAgent(writer)
        await publishFlowRunningAgent({ projectId: owner.project.id, externalId: agent.externalId, displayName: 'Payroll run' })

        const response = await writer.delete(`/v1/agents/${agent.id}`)

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(JSON.stringify(response.json())).not.toContain('Payroll run')
        expect(JSON.stringify(response.json())).toContain('running in 1 published flow.')
    })

    it('deletes an agent whose only reference is an unpublished draft version', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        await publishFlowRunningAgent({ projectId: ctx.project.id, externalId: agent.externalId, displayName: 'Draft only', publish: false })

        expect((await ctx.delete(`/v1/agents/${agent.id}`)).statusCode).toBe(StatusCodes.NO_CONTENT)
    })

    it('ignores a published flow in another project, which cannot be running this agent', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        const other = await context()
        await publishFlowRunningAgent({ projectId: other.project.id, externalId: agent.externalId, displayName: 'Someone elses flow' })

        expect((await ctx.delete(`/v1/agents/${agent.id}`)).statusCode).toBe(StatusCodes.NO_CONTENT)
    })
})

describe('agent publish', () => {
    it('copies the draft to published, so a flow step has something to run', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)

        const response = await ctx.post(`/v1/agents/${agent.id}/publish`)

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json().published).toStrictEqual(response.json().draft)
    })

    it('carries the published copy along when the draft is saved', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)

        await ctx.post(`/v1/agents/${agent.id}`, { draft: { ...agentBody(ctx.project.id).draft, instructions: 'Rewritten.' } })

        const after = (await ctx.get(`/v1/agents/${agent.id}`)).json()
        expect(after.draft.instructions).toBe('Rewritten.')
        expect(after.published.instructions).toBe('Rewritten.')
    })

    it('publishes on the first save, so a flow can run an agent nobody published by hand', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        expect(agent.published).toBeNull()

        await ctx.post(`/v1/agents/${agent.id}`, { description: 'Now with a description.' })

        expect((await ctx.get(`/v1/agents/${agent.id}`)).json().published).not.toBeNull()
    })

    it('stages the draft without going live, so a change can be tested first', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        await ctx.post(`/v1/agents/${agent.id}`, { description: 'Live now.' })
        const live = (await ctx.get(`/v1/agents/${agent.id}`)).json().published

        await ctx.post(`/v1/agents/${agent.id}`, { draft: { ...agentBody(ctx.project.id).draft, instructions: 'Only for the test run.' }, goLive: false })

        const after = (await ctx.get(`/v1/agents/${agent.id}`)).json()
        expect(after.draft.instructions).toBe('Only for the test run.')
        expect(after.published).toStrictEqual(live)
    })

    it.each([['explicitly true', true], ['absent', undefined]])(
        'publishes when goLive is %s, so every existing caller keeps working',
        async (_label, goLive) => {
            const ctx = await context()
            const agent = await createAgent(ctx)

            await ctx.post(`/v1/agents/${agent.id}`, { draft: { ...agentBody(ctx.project.id).draft, instructions: 'Should be live.' }, ...(goLive === undefined ? {} : { goLive }) })

            expect((await ctx.get(`/v1/agents/${agent.id}`)).json().published.instructions).toBe('Should be live.')
        })

    it('keeps published pinned to the same copy across repeated staging', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        await ctx.post(`/v1/agents/${agent.id}`, { description: 'Live copy.' })
        const live = (await ctx.get(`/v1/agents/${agent.id}`)).json().published

        for (const attempt of ['first', 'second', 'third']) {
            await ctx.post(`/v1/agents/${agent.id}`, { draft: { ...agentBody(ctx.project.id).draft, instructions: `Staged ${attempt}.` }, goLive: false })
        }

        const after = (await ctx.get(`/v1/agents/${agent.id}`)).json()
        expect(after.draft.instructions).toBe('Staged third.')
        expect(after.published).toStrictEqual(live)
    })

    it('stages against an agent nobody published yet without inventing a published copy', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        expect(agent.published).toBeNull()

        await ctx.post(`/v1/agents/${agent.id}`, { draft: { ...agentBody(ctx.project.id).draft, instructions: 'Only a draft.' }, goLive: false })

        const after = (await ctx.get(`/v1/agents/${agent.id}`)).json()
        expect(after.draft.instructions).toBe('Only a draft.')
        expect(after.published).toBeNull()
    })

    it('publishes the staged draft when the explicit publish route is used afterwards', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)

        await ctx.post(`/v1/agents/${agent.id}`, { draft: { ...agentBody(ctx.project.id).draft, instructions: 'Staged for review.' }, goLive: false })
        await ctx.post(`/v1/agents/${agent.id}/publish`)

        expect((await ctx.get(`/v1/agents/${agent.id}`)).json().published.instructions).toBe('Staged for review.')
    })

    it('goes live on the next save, so staging is not a trap', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)

        await ctx.post(`/v1/agents/${agent.id}`, { draft: { ...agentBody(ctx.project.id).draft, instructions: 'Staged.' }, goLive: false })
        await ctx.post(`/v1/agents/${agent.id}`, { displayName: 'Ready' })

        const after = (await ctx.get(`/v1/agents/${agent.id}`)).json()
        expect(after.published.instructions).toBe('Staged.')
    })

    it('publishes nothing while the instructions are empty, because there is nothing runnable to pin', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx, { draft: { ...agentBody(ctx.project.id).draft, instructions: '' } })

        await ctx.post(`/v1/agents/${agent.id}`, { description: 'Still empty.' })

        expect((await ctx.get(`/v1/agents/${agent.id}`)).json().published).toBeNull()
    })

    it.each([['spaces', '   '], ['tabs', '\t\t'], ['newlines', '\n\n'], ['empty', '']])(
        'refuses to publish an agent whose instructions are only %s',
        async (_kind, instructions) => {
            const ctx = await context()
            const agent = await createAgent(ctx, { draft: { ...agentBody(ctx.project.id).draft, instructions } })

            expect((await ctx.post(`/v1/agents/${agent.id}/publish`)).statusCode).toBe(StatusCodes.CONFLICT)
            expect((await ctx.get(`/v1/agents/${agent.id}`)).json().published).toBeNull()
        })

    it('keeps a rich config byte-for-byte through the copy', async () => {
        const ctx = await context()
        const draft = {
            instructions: 'Check the brand guide first.',
            provider: null,
            modelName: 'claude-sonnet-4-6',
            maxSteps: 7,
            tools: [],
            structuredOutput: [{ displayName: 'summary', type: 'text' }],
        }
        const agent = await createAgent(ctx, { draft })

        const published = (await ctx.post(`/v1/agents/${agent.id}/publish`)).json().published
        expect(published).toStrictEqual(draft)
    })

    it('republishes the newer draft, and is a no-op when nothing changed', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        const first = (await ctx.post(`/v1/agents/${agent.id}/publish`)).json()
        const again = (await ctx.post(`/v1/agents/${agent.id}/publish`)).json()
        expect(again.published).toStrictEqual(first.published)

        await ctx.post(`/v1/agents/${agent.id}`, { draft: { ...agentBody(ctx.project.id).draft, instructions: 'Second version.' } })
        const third = (await ctx.post(`/v1/agents/${agent.id}/publish`)).json()
        expect(third.published.instructions).toBe('Second version.')
    })

    it('keeps the published config when the agent is edited afterwards', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        await ctx.post(`/v1/agents/${agent.id}/publish`)

        await ctx.post(`/v1/agents/${agent.id}`, { displayName: 'Renamed' })

        const after = (await ctx.get(`/v1/agents/${agent.id}`)).json()
        expect(after.displayName).toBe('Renamed')
        expect(after.published).not.toBeNull()
    })

    it('publishes a piece tool with its predefined input intact', async () => {
        const ctx = await context()
        const draft = {
            instructions: 'File the ticket.',
            provider: null,
            modelName: null,
            maxSteps: 3,
            tools: [{
                type: 'PIECE',
                toolName: 'create_issue',
                pieceMetadata: {
                    pieceName: '@activepieces/piece-github',
                    pieceVersion: '0.1.0',
                    actionName: 'create_issue',
                    predefinedInput: { fields: { title: { mode: 'choose-yourself', value: 'Bug' } } },
                },
            }],
            structuredOutput: [],
        }
        const agent = await createAgent(ctx, { draft })

        expect((await ctx.post(`/v1/agents/${agent.id}/publish`)).json().published).toStrictEqual(draft)
    })

    it('refuses instructions that are only a non-breaking space', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx, { draft: { ...agentBody(ctx.project.id).draft, instructions: '\u00a0' } })

        expect((await ctx.post(`/v1/agents/${agent.id}/publish`)).statusCode).toBe(StatusCodes.CONFLICT)
    })

    it('refuses to publish a restricted agent the caller cannot see', async () => {
        const owner = await context()
        const member = await createMemberContext(app, owner, { projectRole: DefaultProjectRole.EDITOR })
        const agent = await createAgent(owner, { visibility: AgentVisibility.RESTRICTED })

        expect((await member.post(`/v1/agents/${agent.id}/publish`)).statusCode).toBe(StatusCodes.NOT_FOUND)
        expect((await owner.get(`/v1/agents/${agent.id}`)).json().published).toBeNull()
    })

    it('refuses a viewer, and an agent in another project', async () => {
        const owner = await context()
        const viewer = await createMemberContext(app, owner, { projectRole: DefaultProjectRole.VIEWER })
        const stranger = await context()
        const agent = await createAgent(owner)

        expect((await viewer.post(`/v1/agents/${agent.id}/publish`)).statusCode).toBe(StatusCodes.FORBIDDEN)
        expect((await stranger.post(`/v1/agents/${agent.id}/publish`)).statusCode).toBe(StatusCodes.FORBIDDEN)
        expect((await owner.get(`/v1/agents/${agent.id}`)).json().published).toBeNull()
    })
})

describe('agent governance', () => {
    it('keeps a project admin able to see an agent an editor restricted', async () => {
        const owner = await context()
        const editor = await createMemberContext(app, owner, { projectRole: DefaultProjectRole.EDITOR })
        const agent = await createAgent(editor)

        await editor.post(`/v1/agents/${agent.id}`, { visibility: AgentVisibility.RESTRICTED })

        expect((await owner.get(`/v1/agents/${agent.id}`)).statusCode).toBe(StatusCodes.OK)
    })

    it('refuses to let a non-owner hide an agent from the rest of the project', async () => {
        const owner = await context()
        const editor = await createMemberContext(app, owner, { projectRole: DefaultProjectRole.EDITOR })
        const mine = await createAgent(owner)

        const response = await editor.post(`/v1/agents/${mine.id}`, { visibility: AgentVisibility.RESTRICTED })

        expect(response.statusCode).toBe(StatusCodes.FORBIDDEN)
        expect((await owner.get(`/v1/agents/${mine.id}`)).json().visibility).toBe(AgentVisibility.PROJECT)
    })

    it('lets an editor still rename an agent, so the gate is on sharing only', async () => {
        const owner = await context()
        const editor = await createMemberContext(app, owner, { projectRole: DefaultProjectRole.EDITOR })
        const agent = await createAgent(owner)

        expect((await editor.post(`/v1/agents/${agent.id}`, { displayName: 'Renamed' })).statusCode).toBe(StatusCodes.OK)
    })

    it('takes a published agent offline without destroying it', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        await ctx.post(`/v1/agents/${agent.id}/publish`)

        const response = await ctx.post(`/v1/agents/${agent.id}/unpublish`)

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json().published).toBeNull()
        expect(response.json().draft.instructions).toBe('Draft launch posts.')
    })

    it('never returns a stored mcp credential to a reader', async () => {
        const ctx = await context()
        const draft = {
            instructions: 'Use the server.',
            tools: [{
                type: 'MCP',
                toolName: 'remote',
                serverUrl: 'https://mcp.example.com',
                protocol: 'streamable-http',
                auth: { type: 'api_key', apiKey: 'sk-live-SECRET', apiKeyHeader: 'x-api-key' },
            }],
        }
        const agent = await createAgent(ctx, { draft })

        expect((await ctx.get(`/v1/agents/${agent.id}`)).body).not.toContain('sk-live-SECRET')
        expect((await ctx.post(`/v1/agents/${agent.id}/publish`)).body).not.toContain('sk-live-SECRET')
        expect((await ctx.get('/v1/agents')).body).not.toContain('sk-live-SECRET')
    })

    it('keeps the stored credential usable after an unrelated edit', async () => {
        const ctx = await context()
        const draft = {
            instructions: 'Use the server.',
            tools: [{
                type: 'MCP',
                toolName: 'remote',
                serverUrl: 'https://mcp.example.com',
                protocol: 'streamable-http',
                auth: { type: 'api_key', apiKey: 'sk-live-SECRET', apiKeyHeader: 'x-api-key' },
            }],
        }
        const agent = await createAgent(ctx, { draft })

        await ctx.post(`/v1/agents/${agent.id}`, { displayName: 'Renamed' })

        const stored = await db.findOneByOrFail<{ draft: { tools: { auth: { apiKey?: string } }[] } }>('agent', { id: agent.id })
        expect(stored.draft.tools[0].auth.apiKey).toBe('sk-live-SECRET')
    })

    it('refuses a config larger than an agent is allowed to be', async () => {
        const ctx = await context()
        const fields = Object.fromEntries(Array.from({ length: 4000 }, (_, index) => [`f${index}`, { mode: 'choose-yourself', value: 'x'.repeat(100) }]))
        const draft = {
            instructions: 'Big.',
            tools: [{
                type: 'PIECE',
                toolName: 'big',
                pieceMetadata: { pieceName: 'p', pieceVersion: '1.0.0', actionName: 'a', predefinedInput: { fields } },
            }],
        }

        expect((await ctx.post('/v1/agents', agentBody(ctx.project.id, { draft }))).statusCode).toBe(StatusCodes.BAD_REQUEST)
    })
})

describe('agent project isolation', () => {
    it.each([
        ['read', (ctx: TestContext, id: string) => ctx.get(`/v1/agents/${id}`)],
        ['update', (ctx: TestContext, id: string) => ctx.post(`/v1/agents/${id}`, { displayName: 'Hijacked' })],
        ['delete', (ctx: TestContext, id: string) => ctx.delete(`/v1/agents/${id}`)],
    ])('refuses to %s an agent belonging to another project, and leaves it untouched', async (_action, attempt) => {
        const owner = await context()
        const stranger = await context()
        const agent = await createAgent(owner)

        expect((await attempt(stranger, agent.id)).statusCode).toBe(StatusCodes.FORBIDDEN)
        expect((await owner.get(`/v1/agents/${agent.id}`)).json().displayName).toBe('Marketing agent')
    })

    it('refuses to create an agent in a project the caller is not a member of', async () => {
        const owner = await context()
        const stranger = await context()

        expect((await stranger.post('/v1/agents', agentBody(owner.project.id))).statusCode).toBe(StatusCodes.FORBIDDEN)
    })

    it('lists enough for a card without shipping the config', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx, { draft: { ...agentBody(ctx.project.id).draft, tools: [] } })

        const listed = (await ctx.get('/v1/agents')).json().data.find((row: { id: string }) => row.id === agent.id)

        expect(listed.toolCount).toBe(0)
        expect(listed.toolPieceNames).toStrictEqual([])
        expect(listed.draft).toBeUndefined()
        expect(listed.published).toBeUndefined()
    })

    it('never lists another project\'s agents', async () => {
        const owner = await context()
        const stranger = await context()
        await createAgent(owner)
        const own = await createAgent(stranger)

        const listed = (await stranger.get('/v1/agents')).json().data
        expect(listed.map((row: { id: string }) => row.id)).toStrictEqual([own.id])
    })
})

describe('agent sharing rules', () => {
    it('refuses to share with someone who is not in the project', async () => {
        const owner = await context()
        const outsider = await context()

        const response = await owner.post('/v1/agents', agentBody(owner.project.id, {
            visibility: AgentVisibility.RESTRICTED,
            sharedWithUserIds: [outsider.user.id],
        }))

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
    })

    it('drops the share list when the agent goes back to project-wide', async () => {
        const owner = await context()
        const member = await createMemberContext(app, owner, { projectRole: DefaultProjectRole.EDITOR })
        const agent = await createAgent(owner, {
            visibility: AgentVisibility.RESTRICTED,
            sharedWithUserIds: [member.user.id],
        })

        const response = await owner.post(`/v1/agents/${agent.id}`, { visibility: AgentVisibility.PROJECT })

        expect(response.json().sharedWithUserIds).toStrictEqual([])
    })
})

describe('agent list across projects', () => {
    it('narrows to one project on request, and never widens to a project the caller cannot read', async () => {
        const owner = await context()
        const stranger = await context()
        const agent = await createAgent(owner)

        const narrowed = (await owner.get('/v1/agents', { projectId: owner.project.id })).json().data
        expect(narrowed.map((row: { id: string }) => row.id)).toStrictEqual([agent.id])

        const foreign = (await owner.get('/v1/agents', { projectId: stranger.project.id })).json().data
        expect(foreign).toStrictEqual([])
    })

    it('searches by name and by description, and leaves the rest out', async () => {
        const ctx = await context()
        const inbox = await createAgent(ctx, { displayName: 'Inbox triage' })
        const pricing = await createAgent(ctx, { displayName: 'Rival watch', description: 'Reads competitor pricing pages.' })
        await createAgent(ctx, { displayName: 'Meeting notes', description: 'Turns notes into follow-ups.' })

        const byName = (await ctx.get('/v1/agents', { search: 'inbox' })).json().data
        expect(byName.map((row: { id: string }) => row.id)).toStrictEqual([inbox.id])

        const byDescription = (await ctx.get('/v1/agents', { search: 'competitor' })).json().data
        expect(byDescription.map((row: { id: string }) => row.id)).toStrictEqual([pricing.id])

        const noMatch = (await ctx.get('/v1/agents', { search: 'nothing here' })).json().data
        expect(noMatch).toStrictEqual([])
    })

    it('sorts by name when asked, rather than by when it was touched', async () => {
        const ctx = await context()
        const apple = await createAgent(ctx, { displayName: 'Apple duty' })
        const zebra = await createAgent(ctx, { displayName: 'Zebra duty' })

        const byName = (await ctx.get('/v1/agents', { sort: 'name' })).json().data
        expect(byName.map((row: { id: string }) => row.id)).toStrictEqual([apple.id, zebra.id])

        // The newest first, which is the opposite order, so the two cannot both pass by accident.
        const byUpdated = (await ctx.get('/v1/agents', { sort: 'updated' })).json().data
        expect(byUpdated.map((row: { id: string }) => row.id)).toStrictEqual([zebra.id, apple.id])
    })

    it('walks every page with a cursor, so nothing is out of reach', async () => {
        const ctx = await context()
        const created = []
        for (const name of ['One', 'Two', 'Three']) {
            created.push((await createAgent(ctx, { displayName: `Page ${name}` })).id)
        }

        const seen: string[] = []
        let cursor: string | undefined = undefined
        for (let page = 0; page < 5; page++) {
            const body = (await ctx.get('/v1/agents', { limit: '1', ...(cursor === undefined ? {} : { cursor }) })).json()
            seen.push(...body.data.map((row: { id: string }) => row.id))
            if (!body.next) break
            cursor = body.next
        }

        expect(seen.sort()).toStrictEqual([...created].sort())
    })

    it('refuses a page size that would disable pagination', async () => {
        const ctx = await context()

        expect((await ctx.get('/v1/agents', { limit: '-1' })).statusCode).toBe(StatusCodes.BAD_REQUEST)
        expect((await ctx.get('/v1/agents', { limit: '1000000' })).statusCode).toBe(StatusCodes.BAD_REQUEST)
    })
})

describe('agent permissions', () => {
    it('lets a viewer read an agent but never create or change one', async () => {
        const owner = await context()
        const viewer = await createMemberContext(app, owner, { projectRole: DefaultProjectRole.VIEWER })
        const agent = await createAgent(owner)

        expect((await viewer.get(`/v1/agents/${agent.id}`)).statusCode).toBe(StatusCodes.OK)
        expect((await viewer.post('/v1/agents', agentBody(owner.project.id))).statusCode).toBe(StatusCodes.FORBIDDEN)
        expect((await viewer.post(`/v1/agents/${agent.id}`, { displayName: 'Nope' })).statusCode).toBe(StatusCodes.FORBIDDEN)
        expect((await viewer.delete(`/v1/agents/${agent.id}`)).statusCode).toBe(StatusCodes.FORBIDDEN)
    })
})

describe('agent routes coexist with the chat routes already on /v1/agents', () => {
    it('does not swallow the static sibling routes with /:id', async () => {
        const ctx = await createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true } })

        expect((await ctx.get('/v1/agents/memory')).statusCode).toBe(StatusCodes.OK)
        expect((await ctx.get('/v1/agents/conversations')).statusCode).toBe(StatusCodes.OK)
    })

    it('reports a missing agent as not found rather than routing it elsewhere', async () => {
        const ctx = await context()

        expect((await ctx.get(`/v1/agents/${apId()}`)).statusCode).toBe(StatusCodes.NOT_FOUND)
    })
})

describe('agent feature gate', () => {
    it('refuses every agent route once the platform loses the entitlement', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        const plan = await db.findOneByOrFail<{ id: string }>('platform_plan', { platformId: ctx.platform.id })
        await db.update('platform_plan', plan.id, { agentsEnabled: false })

        expect((await ctx.get('/v1/agents')).statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        expect((await ctx.post('/v1/agents', agentBody(ctx.project.id))).statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        expect((await ctx.get(`/v1/agents/${agent.id}`)).statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        expect((await ctx.post(`/v1/agents/${agent.id}`, { displayName: 'x' })).statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        expect((await ctx.post(`/v1/agents/${agent.id}/publish`)).statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        expect((await ctx.post('/v1/agents/draft', { projectId: ctx.project.id, prompt: 'x' })).statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        expect((await ctx.delete(`/v1/agents/${agent.id}`)).statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
    })
})
