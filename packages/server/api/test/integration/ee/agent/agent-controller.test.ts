import { apId } from '@activepieces/core-utils'
import { AgentIcon, AgentVisibility, ColorName, DefaultProjectRole } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
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
    return createTestContext(app, { plan: { chatEnabled: true } })
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

describe('agent project isolation', () => {
    it('refuses to read an agent belonging to another project', async () => {
        const owner = await context()
        const stranger = await context()
        const agent = await createAgent(owner)

        expect((await stranger.get(`/v1/agents/${agent.id}`)).statusCode).toBe(StatusCodes.FORBIDDEN)
    })

    it('refuses to update an agent belonging to another project', async () => {
        const owner = await context()
        const stranger = await context()
        const agent = await createAgent(owner)

        const response = await stranger.post(`/v1/agents/${agent.id}`, { displayName: 'Hijacked' })

        expect(response.statusCode).toBe(StatusCodes.FORBIDDEN)
        expect((await owner.get(`/v1/agents/${agent.id}`)).json().displayName).toBe('Marketing agent')
    })

    it('refuses to delete an agent belonging to another project', async () => {
        const owner = await context()
        const stranger = await context()
        const agent = await createAgent(owner)

        expect((await stranger.delete(`/v1/agents/${agent.id}`)).statusCode).toBe(StatusCodes.FORBIDDEN)
        expect((await owner.get(`/v1/agents/${agent.id}`)).statusCode).toBe(StatusCodes.OK)
    })

    it('refuses to create an agent in a project the caller is not a member of', async () => {
        const owner = await context()
        const stranger = await context()

        const response = await stranger.post('/v1/agents', agentBody(owner.project.id))

        expect(response.statusCode).toBe(StatusCodes.FORBIDDEN)
    })

    it('never lists another project\'s agents', async () => {
        const owner = await context()
        const stranger = await context()
        const agent = await createAgent(owner)

        const own = await createAgent(stranger)

        const listed = (await stranger.get('/v1/agents')).json().data
        expect(listed.map((row: { id: string }) => row.id)).toStrictEqual([own.id])
    })
})

describe('agent visibility', () => {
    it('shows a project-visible agent to every member', async () => {
        const owner = await context()
        const member = await createMemberContext(app, owner, { projectRole: DefaultProjectRole.EDITOR })
        const agent = await createAgent(owner)

        expect((await member.get(`/v1/agents/${agent.id}`)).statusCode).toBe(StatusCodes.OK)
    })

    it('hides a restricted agent from a member it was not shared with, even one who may write', async () => {
        const owner = await context()
        const member = await createMemberContext(app, owner, { projectRole: DefaultProjectRole.EDITOR })
        const agent = await createAgent(owner, { visibility: AgentVisibility.RESTRICTED })

        expect((await member.get(`/v1/agents/${agent.id}`)).statusCode).toBe(StatusCodes.NOT_FOUND)
        expect((await member.post(`/v1/agents/${agent.id}`, { displayName: 'Nope' })).statusCode).toBe(StatusCodes.NOT_FOUND)
        expect((await member.get('/v1/agents')).json().data).toHaveLength(0)
    })

    it('reports success when an editor restricts an agent out of their own view', async () => {
        const owner = await context()
        const member = await createMemberContext(app, owner, { projectRole: DefaultProjectRole.EDITOR })
        const agent = await createAgent(owner)

        const response = await member.post(`/v1/agents/${agent.id}`, { visibility: AgentVisibility.RESTRICTED })

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json().visibility).toBe(AgentVisibility.RESTRICTED)
        expect((await member.get(`/v1/agents/${agent.id}`)).statusCode).toBe(StatusCodes.NOT_FOUND)
        expect((await owner.get(`/v1/agents/${agent.id}`)).json().visibility).toBe(AgentVisibility.RESTRICTED)
    })

    it('shows a restricted agent to a member named in the share', async () => {
        const owner = await context()
        const member = await createMemberContext(app, owner, { projectRole: DefaultProjectRole.EDITOR })
        const agent = await createAgent(owner, {
            visibility: AgentVisibility.RESTRICTED,
            sharedWithUserIds: [member.user.id],
        })

        expect((await member.get(`/v1/agents/${agent.id}`)).statusCode).toBe(StatusCodes.OK)
        expect((await member.get('/v1/agents')).json().data).toHaveLength(1)
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

describe('agent routes coexist with the chat routes already on /v1/agents', () => {
    it('does not swallow the static sibling routes with /:id', async () => {
        const ctx = await context()

        expect((await ctx.get('/v1/agents/memory')).statusCode).toBe(StatusCodes.OK)
        expect((await ctx.get('/v1/agents/conversations')).statusCode).toBe(StatusCodes.OK)
    })

    it('reports a missing agent as not found rather than routing it elsewhere', async () => {
        const ctx = await context()

        expect((await ctx.get(`/v1/agents/${apId()}`)).statusCode).toBe(StatusCodes.NOT_FOUND)
    })
})

describe('agent feature gate', () => {
    it('refuses every agent route when the platform has the surface turned off', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: false } })

        expect((await ctx.get('/v1/agents')).statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        expect((await ctx.post('/v1/agents', agentBody(ctx.project.id))).statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
    })
})
