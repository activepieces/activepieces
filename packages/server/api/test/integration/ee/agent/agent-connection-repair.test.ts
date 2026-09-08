import { apId } from '@activepieces/core-utils'
import { AgentIcon, AgentTool, AgentToolType, ColorName, DefaultProjectRole, ProjectRole } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { encryptUtils } from '../../../../src/app/helper/encryption'
import { db } from '../../../helpers/db'
import { createMockConnection, createMockProjectMember } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

const GMAIL = '@activepieces/piece-gmail'
const SLACK = '@activepieces/piece-slack'

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function context(): Promise<TestContext> {
    return createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true } })
}

async function saveConnection({ ctx, externalId }: { ctx: TestContext, externalId: string }) {
    const connection = createMockConnection({
        platformId: ctx.platform.id,
        projectIds: [ctx.project.id],
        pieceName: GMAIL,
        externalId,
        displayName: externalId,
    }, ctx.user.id)
    await db.save('app_connection', { ...connection, value: await encryptUtils.encryptObject(connection.value) })
    return connection
}

async function createAgent({ ctx, pinnedExternalId, extraTools = [] }: { ctx: TestContext, pinnedExternalId: string | null, extraTools?: AgentTool[] }) {
    const response = await ctx.post('/v1/agents', {
        projectId: ctx.project.id,
        displayName: 'Email organizer',
        icon: AgentIcon.MAIL,
        color: ColorName.BLUE,
        draft: {
            instructions: 'Sort unread mail.',
            provider: null,
            modelName: null,
            maxSteps: 5,
            structuredOutput: [],
            tools: [{
                type: AgentToolType.PIECE,
                toolName: 'gmail-gmail_search_mail_aaaaaa_mcp',
                pieceMetadata: {
                    pieceName: GMAIL,
                    pieceVersion: '0.0.0',
                    actionName: 'gmail_search_mail',
                    ...(pinnedExternalId === null ? {} : { predefinedInput: { auth: pinnedExternalId, fields: {} } }),
                },
            }, ...extraTools],
        },
    })
    expect(response.statusCode).toBe(StatusCodes.CREATED)
    return response.json()
}

async function pickerConnections({ ctx, conversationId, pieceName = GMAIL }: { ctx: TestContext, conversationId: string, pieceName?: string }) {
    const response = await ctx.get(`/v1/agents/conversations/${conversationId}/connections?pieceName=${encodeURIComponent(pieceName)}`)
    expect(response.statusCode).toBe(StatusCodes.OK)
    return response.json()
}

describe('which accounts a conversation may be offered', () => {
    it('offers a saved agent only the account its own tool is pinned to', async () => {
        const ctx = await context()
        const pinned = await saveConnection({ ctx, externalId: apId() })
        const other = await saveConnection({ ctx, externalId: apId() })
        const agent = await createAgent({ ctx, pinnedExternalId: pinned.externalId })
        const conversation = await ctx.post('/v1/agents/conversations', { agentId: agent.id })

        const conversationId = conversation.json().id
        const body = await pickerConnections({ ctx, conversationId })
        const secondRead = await pickerConnections({ ctx, conversationId })

        expect(body.reconnectOnly).toBe(true)
        expect(body.connections.map((connection: { externalId: string }) => connection.externalId)).toEqual([pinned.externalId])
        expect(body.connections.map((connection: { externalId: string }) => connection.externalId)).not.toContain(other.externalId)
        expect(secondRead).toEqual(body)
    })

    it('narrows the account the agent actually runs on, which is the draft one', async () => {
        const ctx = await context()
        const published = await saveConnection({ ctx, externalId: apId() })
        const draftOnly = await saveConnection({ ctx, externalId: apId() })
        const agent = await createAgent({ ctx, pinnedExternalId: published.externalId })
        expect((await ctx.post(`/v1/agents/${agent.id}/publish`, {})).statusCode).toBe(StatusCodes.OK)
        const moved = await ctx.post(`/v1/agents/${agent.id}`, {
            draft: { ...agent.draft, tools: [{ ...agent.draft.tools[0], pieceMetadata: { ...agent.draft.tools[0].pieceMetadata, predefinedInput: { auth: draftOnly.externalId, fields: {} } } }] },
        })
        expect(moved.statusCode).toBe(StatusCodes.OK)
        const conversation = await ctx.post('/v1/agents/conversations', { agentId: agent.id })

        const body = await pickerConnections({ ctx, conversationId: conversation.json().id })

        expect(body.connections.map((connection: { externalId: string }) => connection.externalId)).toEqual([draftOnly.externalId])
    })

    it('falls back to the full picker where the agent pinned no account, because there is nothing to repair', async () => {
        const ctx = await context()
        await saveConnection({ ctx, externalId: apId() })
        const agent = await createAgent({ ctx, pinnedExternalId: null })
        const conversation = await ctx.post('/v1/agents/conversations', { agentId: agent.id })

        const body = await pickerConnections({ ctx, conversationId: conversation.json().id })

        expect(body.reconnectOnly).toBe(false)
    })

    it('never offers a lookalike account from another project, since externalId is not unique', async () => {
        const ctx = await context()
        const shared = 'gmail-shared'
        const pinned = await saveConnection({ ctx, externalId: shared })
        const otherProjectId = apId()
        await db.save('project', { ...ctx.project, id: otherProjectId, externalId: apId(), displayName: 'Second' })
        const role = await db.findOneByOrFail<ProjectRole>('project_role', { name: DefaultProjectRole.ADMIN })
        await db.save('project_member', createMockProjectMember({
            userId: ctx.user.id,
            projectId: otherProjectId,
            platformId: ctx.platform.id,
            projectRoleId: role.id,
        }))
        const lookalike = createMockConnection({
            platformId: ctx.platform.id,
            projectIds: [otherProjectId],
            pieceName: GMAIL,
            externalId: shared,
            displayName: 'lookalike',
        }, ctx.user.id)
        await db.save('app_connection', { ...lookalike, value: await encryptUtils.encryptObject(lookalike.value) })

        const asChat = await ctx.post('/v1/agents/conversations', {})
        const chatBody = await pickerConnections({ ctx, conversationId: asChat.json().id })
        expect(chatBody.connections.length).toBeGreaterThan(1)

        const agent = await createAgent({ ctx, pinnedExternalId: pinned.externalId })
        const asAgent = await ctx.post('/v1/agents/conversations', { agentId: agent.id })
        const body = await pickerConnections({ ctx, conversationId: asAgent.json().id })

        expect(body.reconnectOnly).toBe(true)
        expect(body.connections).toHaveLength(1)
        expect(body.connections[0].projectId).toBe(ctx.project.id)
    })

    it('says the pinned account is gone rather than offering the rest', async () => {
        const ctx = await context()
        const other = await saveConnection({ ctx, externalId: apId() })
        const agent = await createAgent({ ctx, pinnedExternalId: 'a-connection-that-was-deleted' })
        const conversation = await ctx.post('/v1/agents/conversations', { agentId: agent.id })

        const body = await pickerConnections({ ctx, conversationId: conversation.json().id })

        expect(body.reconnectOnly).toBe(true)
        expect(body.connections).toEqual([])
        expect(body.connections.map((connection: { externalId: string }) => connection.externalId)).not.toContain(other.externalId)
    })

    it('reads a pin that an older tool stored as a template, rather than calling the account gone', async () => {
        const ctx = await context()
        const pinned = await saveConnection({ ctx, externalId: apId() })
        const agent = await createAgent({ ctx, pinnedExternalId: `{{connections['${pinned.externalId}']}}` })
        const conversation = await ctx.post('/v1/agents/conversations', { agentId: agent.id })

        const body = await pickerConnections({ ctx, conversationId: conversation.json().id })

        expect(body.reconnectOnly).toBe(true)
        expect(body.connections.map((connection: { externalId: string }) => connection.externalId)).toEqual([pinned.externalId])
    })

    it('narrows only the piece that was asked about, leaving the agent other tools alone', async () => {
        const ctx = await context()
        const gmail = await saveConnection({ ctx, externalId: apId() })
        const slack = createMockConnection({
            platformId: ctx.platform.id,
            projectIds: [ctx.project.id],
            pieceName: SLACK,
            externalId: apId(),
            displayName: 'slack account',
        }, ctx.user.id)
        await db.save('app_connection', { ...slack, value: await encryptUtils.encryptObject(slack.value) })
        const agent = await createAgent({ ctx, pinnedExternalId: gmail.externalId, extraTools: [{
            type: AgentToolType.PIECE,
            toolName: 'slack-send_channel_message_bbbbbb_mcp',
            pieceMetadata: { pieceName: SLACK, pieceVersion: '0.0.0', actionName: 'send_channel_message' },
        }] })
        const conversation = await ctx.post('/v1/agents/conversations', { agentId: agent.id })
        const conversationId = conversation.json().id

        const gmailBody = await pickerConnections({ ctx, conversationId, pieceName: GMAIL })
        const slackBody = await pickerConnections({ ctx, conversationId, pieceName: SLACK })

        expect(gmailBody.reconnectOnly).toBe(true)
        expect(slackBody.reconnectOnly).toBe(false)
    })

    it('leaves the builder the full picker, because pinning an account is what it is for', async () => {
        const ctx = await context()
        const pinned = await saveConnection({ ctx, externalId: apId() })
        await saveConnection({ ctx, externalId: apId() })
        const agent = await createAgent({ ctx, pinnedExternalId: pinned.externalId })
        const conversation = await ctx.post('/v1/agents/conversations', { agentId: agent.id, builder: true })

        const body = await pickerConnections({ ctx, conversationId: conversation.json().id })

        expect(body.reconnectOnly).toBe(false)
        expect(body.connections.length).toBeGreaterThan(1)
    })

    it('leaves a chat conversation the full picker', async () => {
        const ctx = await context()
        await saveConnection({ ctx, externalId: apId() })
        const conversation = await ctx.post('/v1/agents/conversations', {})

        const body = await pickerConnections({ ctx, conversationId: conversation.json().id })

        expect(body.reconnectOnly).toBe(false)
    })
})
