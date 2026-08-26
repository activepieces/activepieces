import { AgentToolType, PackageType, PieceType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { executeCrossProjectTool } from '../../../../src/app/ee/agent/tools/agent-tools'
import { db } from '../../../helpers/db'
import { createMockConnection, createMockPieceMetadata } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

const TOOL_PIECE = '@activepieces/piece-test-notes'
const TOOL_PIECE_VERSION = '0.4.2'

beforeAll(async () => {
    process.env.AP_AGENTS_ENABLED = 'true'
    app = await setupTestEnvironment()
    await db.save('piece_metadata', createMockPieceMetadata({
        name: TOOL_PIECE,
        displayName: 'Test Notes',
        version: TOOL_PIECE_VERSION,
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
        platformId: undefined,
        actions: {
            save_note: {
                name: 'save_note',
                displayName: 'Save Note',
                description: 'Save a note',
                requireAuth: true,
                props: {},
            },
        },
    }))
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function context(): Promise<TestContext> {
    return createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true } })
}

// A chat conversation starts with no project and picks one up when the user selects it, so the
// tools have nothing to write to until then. Selecting it is what the browser does before any of
// this is reachable.
async function startConversation(ctx: TestContext): Promise<string> {
    const response = await ctx.post('/v1/agents/conversations', {})
    expect(response.statusCode).toBe(StatusCodes.CREATED)
    const conversationId = response.json().id
    await db.update('agent_conversation', conversationId, { projectId: ctx.project.id })
    return conversationId
}

async function runTool(ctx: TestContext, conversationId: string, toolName: string, toolInput: Record<string, unknown> = {}) {
    return executeCrossProjectTool({
        toolName,
        toolInput,
        platformId: ctx.platform.id,
        userId: ctx.user.id,
        conversationId,
        log: app.log,
    })
}

async function agentRow(id: string) {
    return db.findOneByOrFail<{ id: string, displayName: string, draft: Record<string, unknown>, published: Record<string, unknown> | null }>('agent', { id })
}

describe('the chat tools that build agents, against the real service', () => {
    it('creates an agent the API can then read back', async () => {
        const ctx = await context()
        const conversationId = await startConversation(ctx)

        const created = await runTool(ctx, conversationId, 'ap_create_agent', {
            displayName: 'Inbox triage',
            instructions: 'Flag anything needing a reply today.',
        })

        const { agentId } = created as { agentId: string }
        const stored = await agentRow(agentId)
        expect(stored.displayName).toBe('Inbox triage')
        expect(stored.published).toBeNull()
        expect(stored.draft.tools).toEqual([])

        const read = await ctx.get(`/v1/agents/${agentId}`)
        expect(read.statusCode).toBe(StatusCodes.OK)
        expect(read.json().draft.instructions).toBe('Flag anything needing a reply today.')
    })

    it('publishes the edit it was asked to publish, not the version before it', async () => {
        const ctx = await context()
        const conversationId = await startConversation(ctx)
        const { agentId } = await runTool(ctx, conversationId, 'ap_create_agent', {
            displayName: 'Inbox triage',
            instructions: 'First brief.',
        }) as { agentId: string }

        const result = await runTool(ctx, conversationId, 'ap_update_agent', {
            agentId,
            instructions: 'Second brief, ignore newsletters.',
            publish: true,
        })

        expect(result).toEqual(expect.objectContaining({ published: true }))
        const stored = await agentRow(agentId)
        expect(stored.draft.instructions).toBe('Second brief, ignore newsletters.')
        expect(stored.published?.instructions).toBe('Second brief, ignore newsletters.')
    })

    it('gives an agent a real piece action, pinned to the version the server resolved', async () => {
        const ctx = await context()
        const conversationId = await startConversation(ctx)
        const connection = createMockConnection({
            projectIds: [ctx.project.id],
            platformId: ctx.platform.id,
            pieceName: TOOL_PIECE,
        }, ctx.user.id)
        await db.save('app_connection', connection)
        const { agentId } = await runTool(ctx, conversationId, 'ap_create_agent', {
            displayName: 'Storer',
            instructions: 'Keep notes.',
        }) as { agentId: string }

        const result = await runTool(ctx, conversationId, 'ap_add_agent_tool', {
            agentId,
            pieceName: TOOL_PIECE,
            actionName: 'save_note',
            connectionExternalId: connection.externalId,
            publish: true,
        })

        expect(result).toEqual(expect.objectContaining({ published: true, changed: ['tool save_note'] }))
        const stored = await agentRow(agentId)
        const [tool] = stored.draft.tools as Array<{ type: string, toolName: string, pieceMetadata: { pieceVersion: string, predefinedInput?: { auth: string } } }>
        expect(tool.type).toBe(AgentToolType.PIECE)
        expect(tool.toolName).toBe('save_note')
        expect(tool.pieceMetadata.pieceVersion).toBe(TOOL_PIECE_VERSION)
        expect(tool.pieceMetadata.predefinedInput?.auth).toBe(connection.externalId)
        expect((stored.published?.tools as unknown[])).toHaveLength(1)
    })

    it('refuses an action the piece does not have', async () => {
        const ctx = await context()
        const conversationId = await startConversation(ctx)
        const { agentId } = await runTool(ctx, conversationId, 'ap_create_agent', {
            displayName: 'Storer',
            instructions: 'Keep notes.',
        }) as { agentId: string }

        const result = await runTool(ctx, conversationId, 'ap_add_agent_tool', {
            agentId,
            pieceName: TOOL_PIECE,
            actionName: 'invented_action',
        })

        expect(result).toEqual({ error: expect.stringContaining('no action called') })
        expect((await agentRow(agentId)).draft.tools).toEqual([])
    })

    it('lists the project\'s agents with whether a flow could run them', async () => {
        const ctx = await context()
        const conversationId = await startConversation(ctx)
        const { agentId } = await runTool(ctx, conversationId, 'ap_create_agent', {
            displayName: 'Published one',
            instructions: 'Do the thing.',
        }) as { agentId: string }
        await runTool(ctx, conversationId, 'ap_publish_agent', { agentId })
        await runTool(ctx, conversationId, 'ap_create_agent', { displayName: 'Draft one', instructions: 'Not ready.' })

        const listed = await runTool(ctx, conversationId, 'ap_list_agents') as Array<{ displayName: string, published: boolean }>

        expect(listed).toEqual(expect.arrayContaining([
            expect.objectContaining({ displayName: 'Published one', published: true }),
            expect.objectContaining({ displayName: 'Draft one', published: false }),
        ]))
    })

    it('cannot touch an agent in another project, even with its real id', async () => {
        const mine = await context()
        const theirs = await context()
        const theirConversation = await startConversation(theirs)
        const { agentId } = await runTool(theirs, theirConversation, 'ap_create_agent', {
            displayName: 'Theirs',
            instructions: 'Private.',
        }) as { agentId: string }
        const myConversation = await startConversation(mine)

        const updated = await runTool(mine, myConversation, 'ap_update_agent', { agentId, instructions: 'Mine now.' })
        const published = await runTool(mine, myConversation, 'ap_publish_agent', { agentId })

        expect(updated).toEqual({ error: expect.stringContaining('No agent with that id') })
        expect(published).toEqual({ error: expect.stringContaining('Could not publish') })
        const stored = await agentRow(agentId)
        expect(stored.draft.instructions).toBe('Private.')
        expect(stored.published).toBeNull()
    })

    it('refuses every agent tool once the platform loses the entitlement', async () => {
        const ctx = await createTestContext(app, { plan: { agentsEnabled: false, chatEnabled: true } })
        const conversationId = await startConversation(ctx)

        for (const toolName of ['ap_list_agents', 'ap_create_agent', 'ap_update_agent', 'ap_publish_agent', 'ap_add_agent_tool']) {
            const result = await runTool(ctx, conversationId, toolName, { displayName: 'x', instructions: 'y', agentId: 'z' })
            expect(result, toolName).toEqual({ error: expect.stringContaining('not available here') })
        }
    })
})
