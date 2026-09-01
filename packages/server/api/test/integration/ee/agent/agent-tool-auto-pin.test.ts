import { PackageType, PieceType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { executeCrossProjectTool } from '../../../../src/app/ee/agent/tools/agent-tools'
import { encryptUtils } from '../../../../src/app/helper/encryption'
import { db } from '../../../helpers/db'
import { createMockConnection, createMockPieceMetadata } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

const AUTH_PIECE = '@activepieces/piece-test-mailer'
const OPEN_PIECE = '@activepieces/piece-test-clock'

const action = (name: string) => ({ name, displayName: name, description: name, requireAuth: true, props: {} })

beforeAll(async () => {
    process.env.AP_AGENTS_ENABLED = 'true'
    app = await setupTestEnvironment()
    await db.save('piece_metadata', createMockPieceMetadata({
        name: AUTH_PIECE,
        displayName: 'Test Mailer',
        version: '1.0.0',
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
        platformId: undefined,
        auth: { type: 'SECRET_TEXT', displayName: 'Key', required: true },
        actions: { send_mail: action('send_mail'), read_mail: action('read_mail') },
    }))
    await db.save('piece_metadata', createMockPieceMetadata({
        name: OPEN_PIECE,
        displayName: 'Test Clock',
        version: '1.0.0',
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
        platformId: undefined,
        actions: { now: { name: 'now', displayName: 'Now', description: 'Now', requireAuth: false, props: {} } },
    }))
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function context(): Promise<TestContext> {
    return createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true } })
}

async function startConversation(ctx: TestContext): Promise<string> {
    const response = await ctx.post('/v1/agents/conversations', {})
    expect(response.statusCode).toBe(StatusCodes.CREATED)
    const conversationId = response.json().id
    await db.update('agent_conversation', conversationId, { projectId: ctx.project.id })
    return conversationId
}

async function runTool(ctx: TestContext, conversationId: string, toolName: string, toolInput: Record<string, unknown> = {}) {
    return executeCrossProjectTool({ toolName, toolInput, platformId: ctx.platform.id, userId: ctx.user.id, conversationId, log: app.log })
}

async function newAgent(ctx: TestContext, conversationId: string): Promise<string> {
    const created = await runTool(ctx, conversationId, 'ap_create_agent', { displayName: 'Mailer', instructions: 'Handle mail.' }) as { agentId: string }
    return created.agentId
}

async function pinnedAuthOn(id: string): Promise<(string | undefined)[]> {
    const row = await db.findOneByOrFail<{ draft: { tools: Array<{ pieceMetadata?: { predefinedInput?: { auth?: string } } }> } }>('agent', { id })
    return row.draft.tools.map((tool) => tool.pieceMetadata?.predefinedInput?.auth)
}

async function saveConnection(ctx: TestContext, displayName: string) {
    const connection = createMockConnection({ projectIds: [ctx.project.id], platformId: ctx.platform.id, pieceName: AUTH_PIECE, displayName }, ctx.user.id)
    await db.save('app_connection', { ...connection, value: await encryptUtils.encryptObject(connection.value) })
    return connection
}

describe('adding a tool that needs an account', () => {
    it('pins the only account in the project, so the agent never has to ask', async () => {
        const ctx = await context()
        const conversationId = await startConversation(ctx)
        const agentId = await newAgent(ctx, conversationId)
        const connection = await saveConnection(ctx, 'Work mail')

        await runTool(ctx, conversationId, 'ap_add_agent_tool', { agentId, pieceName: AUTH_PIECE, actionNames: ['send_mail'] })

        expect(await pinnedAuthOn(agentId)).toStrictEqual([connection.externalId])
    })

    it('pins the same account onto every action added at once', async () => {
        const ctx = await context()
        const conversationId = await startConversation(ctx)
        const agentId = await newAgent(ctx, conversationId)
        const connection = await saveConnection(ctx, 'Work mail')

        await runTool(ctx, conversationId, 'ap_add_agent_tool', { agentId, pieceName: AUTH_PIECE, actionNames: ['send_mail', 'read_mail'] })

        expect(await pinnedAuthOn(agentId)).toStrictEqual([connection.externalId, connection.externalId])
    })

    it('points at the connection card when the project has no account, instead of asking forever', async () => {
        const ctx = await context()
        const conversationId = await startConversation(ctx)
        const agentId = await newAgent(ctx, conversationId)

        const result = await runTool(ctx, conversationId, 'ap_add_agent_tool', { agentId, pieceName: AUTH_PIECE, actionNames: ['send_mail'] })

        expect(result).toEqual({ error: expect.stringContaining('No Test Mailer account is connected') })
        expect(await pinnedAuthOn(agentId)).toStrictEqual([])
    })

    it('points at the picker and keeps the ids out of the sentence when there are several', async () => {
        const ctx = await context()
        const conversationId = await startConversation(ctx)
        const agentId = await newAgent(ctx, conversationId)
        const first = await saveConnection(ctx, 'Work mail')
        const second = await saveConnection(ctx, 'Personal mail')

        const result = await runTool(ctx, conversationId, 'ap_add_agent_tool', { agentId, pieceName: AUTH_PIECE, actionNames: ['send_mail'] })

        expect(result).toEqual(expect.objectContaining({ error: expect.stringContaining('2 Test Mailer accounts') }))
        // The ids belong in a field, not in the sentence the model reads out.
        expect((result as { error: string }).error).not.toContain(first.externalId)
        expect(JSON.stringify((result as { accounts: unknown }).accounts)).toContain(first.externalId)
        expect(JSON.stringify((result as { accounts: unknown }).accounts)).toContain(second.externalId)
        expect(await pinnedAuthOn(agentId)).toStrictEqual([])
    })

    it('honours an explicit account even when the project has only one, so the caller stays in charge', async () => {
        const ctx = await context()
        const conversationId = await startConversation(ctx)
        const agentId = await newAgent(ctx, conversationId)
        await saveConnection(ctx, 'Work mail')
        const chosen = await saveConnection(ctx, 'Personal mail')

        await runTool(ctx, conversationId, 'ap_add_agent_tool', { agentId, pieceName: AUTH_PIECE, actionNames: ['send_mail'], connectionExternalId: chosen.externalId })

        expect(await pinnedAuthOn(agentId)).toStrictEqual([chosen.externalId])
    })

    it('adds a tool that needs no account with nothing pinned, which is correct rather than missing', async () => {
        const ctx = await context()
        const conversationId = await startConversation(ctx)
        const agentId = await newAgent(ctx, conversationId)

        await runTool(ctx, conversationId, 'ap_add_agent_tool', { agentId, pieceName: OPEN_PIECE, actionNames: ['now'] })

        expect(await pinnedAuthOn(agentId)).toStrictEqual([undefined])
    })
})
