import { apId } from '@activepieces/core-utils'
import { AgentIcon, AgentVisibility, ColorName, DEFAULT_AGENT_MAX_STEPS, DefaultProjectRole, MAX_DRAFT_PROMPT_LENGTH } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../helpers/db'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { DRAFTS_PER_MINUTE } from '../../../../src/app/ee/agent/agent-controller'
import { AGENT_TEMPLATES } from '../../../../src/app/ee/agent/agent-templates'
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

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('agent crud', () => {
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
})

describe('agent publish', () => {
    it('copies the draft to published, so a flow step has something to run', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)

        const response = await ctx.post(`/v1/agents/${agent.id}/publish`)

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json().published).toStrictEqual(response.json().draft)
    })

    it('leaves the published copy alone when the draft moves on', async () => {
        const ctx = await context()
        const agent = await createAgent(ctx)
        await ctx.post(`/v1/agents/${agent.id}/publish`)

        await ctx.post(`/v1/agents/${agent.id}`, { draft: { ...agentBody(ctx.project.id).draft, instructions: 'Rewritten.' } })

        const after = (await ctx.get(`/v1/agents/${agent.id}`)).json()
        expect(after.draft.instructions).toBe('Rewritten.')
        expect(after.published.instructions).toBe('Draft launch posts.')
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

describe('agent templates', () => {
    it('serves starter agents with no ai provider and no connections configured', async () => {
        const ctx = await context()

        const response = await ctx.get('/v1/agents/templates')

        expect(response.statusCode).toBe(StatusCodes.OK)
        const templates = response.json().data
        expect(templates.length).toBe(AGENT_TEMPLATES.length)
        expect(new Set(templates.map((t: { id: string }) => t.id)).size).toBe(templates.length)
        for (const template of templates) {
            expect(template.instructions.length).toBeGreaterThan(0)
        }
    })

    it.each(AGENT_TEMPLATES.map((template) => [template.id, template]))(
        'creates and publishes the %s starter, with only what the template carries',
        async (_id, template) => {
            const ctx = await context()

            const created = await ctx.post('/v1/agents', {
                projectId: ctx.project.id,
                displayName: template.displayName,
                description: template.description,
                icon: template.icon,
                color: template.color,
                draft: { instructions: template.instructions },
            })

            expect(created.statusCode).toBe(StatusCodes.CREATED)
            expect(created.json().description).toBe(template.description)
            expect(created.json().draft.maxSteps).toBe(DEFAULT_AGENT_MAX_STEPS)
            expect((await ctx.post(`/v1/agents/${created.json().id}/publish`)).statusCode).toBe(StatusCodes.OK)
        })

    it('tells the caller to connect a provider, rather than naming an internal entity', async () => {
        const ctx = await context()

        const drafted = await ctx.post('/v1/agents/draft', { projectId: ctx.project.id, prompt: 'watch competitor pricing' })

        expect(drafted.statusCode).toBe(StatusCodes.CONFLICT)
        expect(drafted.body).toContain('Connect an AI provider')
        expect(drafted.body).not.toContain('ChatAiProvider')
    })

    it('rate limits one caller without blocking another on the same platform', async () => {
        const owner = await context()
        const colleague = await createMemberContext(app, owner, { projectRole: DefaultProjectRole.EDITOR })
        const draft = (ctx: TestContext) => ctx.post('/v1/agents/draft', { projectId: owner.project.id, prompt: 'watch competitor pricing' })

        const responses = []
        for (let attempt = 0; attempt <= DRAFTS_PER_MINUTE; attempt++) {
            responses.push(await draft(owner))
        }

        expect(responses[responses.length - 1].body).toContain(`above the limit of ${DRAFTS_PER_MINUTE}`)
        expect((await draft(colleague)).body).not.toContain('above the limit')
    })

    it('refuses a draft prompt longer than the endpoint is meant to take', async () => {
        const ctx = await context()

        const response = await ctx.post('/v1/agents/draft', { projectId: ctx.project.id, prompt: 'a'.repeat(MAX_DRAFT_PROMPT_LENGTH + 1) })

        expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST)
    })

    it('refuses to draft for a project the caller cannot write', async () => {
        const owner = await context()
        const viewer = await createMemberContext(app, owner, { projectRole: DefaultProjectRole.VIEWER })

        const response = await viewer.post('/v1/agents/draft', { projectId: owner.project.id, prompt: 'anything' })

        expect(response.statusCode).toBe(StatusCodes.FORBIDDEN)
    })

})

describe('agent routes coexist with the chat routes already on /v1/agents', () => {
    it('does not swallow the static sibling routes with /:id', async () => {
        const ctx = await createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true } })

        expect((await ctx.get('/v1/agents/templates')).statusCode).toBe(StatusCodes.OK)
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
        expect((await ctx.get('/v1/agents/templates')).statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        expect((await ctx.post('/v1/agents/draft', { projectId: ctx.project.id, prompt: 'x' })).statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        expect((await ctx.delete(`/v1/agents/${agent.id}`)).statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
    })
})
