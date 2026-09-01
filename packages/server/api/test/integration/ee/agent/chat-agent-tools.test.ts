import { apId } from '@activepieces/core-utils'
import { unique } from '@activepieces/core-utils'
import { AgentToolType, mcpToolNameUtils, PackageType, PieceType } from '@activepieces/shared'
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
const RIVAL_PIECE = '@activepieces/piece-test-memos'

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
            read_note: {
                name: 'read_note',
                displayName: 'Read Note',
                description: 'Read a note',
                requireAuth: true,
                props: {},
            },
        },
    }))
    await db.save('piece_metadata', createMockPieceMetadata({
        name: RIVAL_PIECE,
        displayName: 'Test Memos',
        version: '1.0.0',
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
        platformId: undefined,
        actions: {
            save_note: {
                name: 'save_note',
                displayName: 'Save Note',
                description: 'Save a memo',
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

async function actionNamesOn(id: string): Promise<string[]> {
    const tools = (await agentRow(id)).draft.tools as Array<{ pieceMetadata?: { actionName: string } }>
    return tools.flatMap((tool) => tool.pieceMetadata?.actionName ?? [])
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
            actionNames: ['save_note'],
            connectionExternalId: connection.externalId,
            publish: true,
        })

        expect(result).toEqual(expect.objectContaining({ published: true }))
        const stored = await agentRow(agentId)
        const [tool] = stored.draft.tools as Array<{ type: string, toolName: string, pieceMetadata: { actionName: string, pieceVersion: string, predefinedInput?: { auth: string } } }>
        expect(tool.type).toBe(AgentToolType.PIECE)
        expect(tool.pieceMetadata.actionName).toBe('save_note')
        expect(tool.toolName).toBe(mcpToolNameUtils.createPieceToolName(TOOL_PIECE, 'save_note'))
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
            actionNames: ['invented_action'],
        })

        expect(result).toEqual({ error: expect.stringContaining('no action called') })
        expect((await agentRow(agentId)).draft.tools).toEqual([])
    })

    it('keeps the tools an agent already has when its instructions change', async () => {
        const ctx = await context()
        const conversationId = await startConversation(ctx)
        const { agentId } = await runTool(ctx, conversationId, 'ap_create_agent', {
            displayName: 'Storer', instructions: 'Keep notes.',
        }) as { agentId: string }
        await runTool(ctx, conversationId, 'ap_add_agent_tool', { agentId, pieceName: TOOL_PIECE, actionNames: ['save_note'], publish: true })

        const result = await runTool(ctx, conversationId, 'ap_update_agent', { agentId, instructions: 'Keep fewer notes.' })

        expect(result).toEqual(expect.objectContaining({ note: expect.stringContaining('do not tell the user the change is live') }))
        const stored = await agentRow(agentId)
        expect(stored.draft.instructions).toBe('Keep fewer notes.')
        expect(stored.draft.tools).toHaveLength(1)
    })

    it('publishes on request alone, with nothing else to change', async () => {
        const ctx = await context()
        const conversationId = await startConversation(ctx)
        const { agentId } = await runTool(ctx, conversationId, 'ap_create_agent', {
            displayName: 'Storer', instructions: 'Keep notes.',
        }) as { agentId: string }

        const result = await runTool(ctx, conversationId, 'ap_update_agent', { agentId, publish: true })

        expect(result).toEqual(expect.objectContaining({ published: true }))
        expect((await agentRow(agentId)).published?.instructions).toBe('Keep notes.')
    })

    it('says nothing is live when the publish after an edit fails', async () => {
        const ctx = await context()
        const conversationId = await startConversation(ctx)
        const { agentId } = await runTool(ctx, conversationId, 'ap_create_agent', {
            displayName: 'Storer', instructions: 'Keep notes.',
        }) as { agentId: string }
        await db.update('agent', agentId, { draft: { instructions: '  ', maxSteps: 20, tools: [], structuredOutput: [] } })

        const result = await runTool(ctx, conversationId, 'ap_update_agent', { agentId, displayName: 'Renamed', publish: true })

        expect(result).toEqual(expect.objectContaining({ published: false, note: expect.stringContaining('nothing is live yet') }))
        expect((await agentRow(agentId)).published).toBeNull()
    })

    it('hides the surface rather than failing the turn when the plan cannot be read', async () => {
        const ctx = await context()
        const conversationId = await startConversation(ctx)

        const result = await executeCrossProjectTool({
            toolName: 'ap_list_agents',
            toolInput: {},
            platformId: apId(),
            userId: ctx.user.id,
            conversationId,
            log: app.log,
        }) as { error?: string }

        expect(result.error).toContain('not available')
    })

    it('keeps two pieces that name their action the same, under distinct tool names', async () => {
        const ctx = await context()
        const conversationId = await startConversation(ctx)
        const { agentId } = await runTool(ctx, conversationId, 'ap_create_agent', {
            displayName: 'Storer', instructions: 'Keep notes.',
        }) as { agentId: string }

        await runTool(ctx, conversationId, 'ap_add_agent_tool', { agentId, pieceName: TOOL_PIECE, actionNames: ['save_note'] })
        await runTool(ctx, conversationId, 'ap_add_agent_tool', { agentId, pieceName: RIVAL_PIECE, actionNames: ['save_note'] })

        const tools = (await agentRow(agentId)).draft.tools as Array<{ toolName: string, pieceMetadata: { pieceName: string } }>
        expect(tools.map((tool) => tool.pieceMetadata.pieceName).sort()).toEqual([RIVAL_PIECE, TOOL_PIECE])
        expect(unique(tools.map((tool) => tool.toolName))).toHaveLength(2)
    })

    it('asks which piece when an action name is on more than one of them', async () => {
        const ctx = await context()
        const conversationId = await startConversation(ctx)
        const { agentId } = await runTool(ctx, conversationId, 'ap_create_agent', {
            displayName: 'Storer', instructions: 'Keep notes.',
        }) as { agentId: string }
        await runTool(ctx, conversationId, 'ap_add_agent_tool', { agentId, pieceName: TOOL_PIECE, actionNames: ['save_note'] })
        await runTool(ctx, conversationId, 'ap_add_agent_tool', { agentId, pieceName: RIVAL_PIECE, actionNames: ['save_note'] })

        const result = await runTool(ctx, conversationId, 'ap_remove_agent_tool', { agentId, actionNames: ['save_note'] }) as { error?: string }

        expect(result.error).toContain('more than one piece')
        expect((await agentRow(agentId)).draft.tools).toHaveLength(2)

        const resolved = await runTool(ctx, conversationId, 'ap_remove_agent_tool', {
            agentId, actionNames: ['save_note'], pieceName: RIVAL_PIECE,
        }) as { error?: string }

        expect(resolved.error).toBeUndefined()
        const left = (await agentRow(agentId)).draft.tools as Array<{ pieceMetadata: { pieceName: string } }>
        expect(left.map((tool) => tool.pieceMetadata.pieceName)).toEqual([TOOL_PIECE])
    })

    it('removes nothing when pieceName would silently skip one of the actions asked for', async () => {
        const ctx = await context()
        const conversationId = await startConversation(ctx)
        const { agentId } = await runTool(ctx, conversationId, 'ap_create_agent', {
            displayName: 'Storer', instructions: 'Keep notes.',
        }) as { agentId: string }
        await runTool(ctx, conversationId, 'ap_add_agent_tool', { agentId, pieceName: TOOL_PIECE, actionNames: ['save_note', 'read_note'] })
        await runTool(ctx, conversationId, 'ap_add_agent_tool', { agentId, pieceName: RIVAL_PIECE, actionNames: ['save_note'] })

        const result = await runTool(ctx, conversationId, 'ap_remove_agent_tool', {
            agentId, actionNames: ['save_note', 'read_note'], pieceName: RIVAL_PIECE,
        }) as { error?: string }

        expect(result.error).toContain('read_note is not on')
        expect((await agentRow(agentId)).draft.tools).toHaveLength(3)
    })

    it('removes two actions that live on different pieces without asking anything', async () => {
        const ctx = await context()
        const conversationId = await startConversation(ctx)
        const { agentId } = await runTool(ctx, conversationId, 'ap_create_agent', {
            displayName: 'Storer', instructions: 'Keep notes.',
        }) as { agentId: string }
        await runTool(ctx, conversationId, 'ap_add_agent_tool', { agentId, pieceName: TOOL_PIECE, actionNames: ['read_note'] })
        await runTool(ctx, conversationId, 'ap_add_agent_tool', { agentId, pieceName: RIVAL_PIECE, actionNames: ['save_note'] })

        const result = await runTool(ctx, conversationId, 'ap_remove_agent_tool', {
            agentId, actionNames: ['read_note', 'save_note'],
        }) as { error?: string }

        expect(result.error).toBeUndefined()
        expect((await agentRow(agentId)).draft.tools).toHaveLength(0)
    })

    it('keeps both tools when the model adds two at once', async () => {
        const ctx = await context()
        const conversationId = await startConversation(ctx)
        const { agentId } = await runTool(ctx, conversationId, 'ap_create_agent', {
            displayName: 'Storer', instructions: 'Keep notes.',
        }) as { agentId: string }

        await Promise.all([
            runTool(ctx, conversationId, 'ap_add_agent_tool', { agentId, pieceName: TOOL_PIECE, actionNames: ['save_note'] }),
            runTool(ctx, conversationId, 'ap_add_agent_tool', { agentId, pieceName: TOOL_PIECE, actionNames: ['read_note'] }),
        ])

        expect((await actionNamesOn(agentId)).sort()).toEqual(['read_note', 'save_note'])
    })

    it('takes a tool away again, and says so when there is none to take', async () => {
        const ctx = await context()
        const conversationId = await startConversation(ctx)
        const { agentId } = await runTool(ctx, conversationId, 'ap_create_agent', {
            displayName: 'Storer', instructions: 'Keep notes.',
        }) as { agentId: string }
        await runTool(ctx, conversationId, 'ap_add_agent_tool', { agentId, pieceName: TOOL_PIECE, actionNames: ['save_note'] })

        const removed = await runTool(ctx, conversationId, 'ap_remove_agent_tool', { agentId, actionNames: ['save_note'], publish: true })
        const again = await runTool(ctx, conversationId, 'ap_remove_agent_tool', { agentId, actionNames: ['save_note'] })

        expect(removed).toEqual(expect.objectContaining({ published: true }))
        expect(again).toEqual({ error: expect.stringContaining('nothing to remove') })
        const stored = await agentRow(agentId)
        expect(stored.draft.tools).toEqual([])
        expect(stored.published?.tools).toEqual([])
    })

    it('refuses until the conversation has a project to write to', async () => {
        const ctx = await context()
        const response = await ctx.post('/v1/agents/conversations', {})
        const conversationId = response.json().id

        const result = await runTool(ctx, conversationId, 'ap_create_agent', { displayName: 'x', instructions: 'y' })

        expect(result).toEqual({ error: expect.stringContaining('No project is selected') })
    })

    it('lists the project\'s agents with whether a flow could run them', async () => {
        const ctx = await context()
        const conversationId = await startConversation(ctx)
        const { agentId } = await runTool(ctx, conversationId, 'ap_create_agent', {
            displayName: 'Published one',
            instructions: 'Do the thing.',
        }) as { agentId: string }
        await runTool(ctx, conversationId, 'ap_update_agent', { agentId, publish: true })
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

        const updated = await runTool(mine, myConversation, 'ap_update_agent', { agentId, instructions: 'Mine now.', publish: true })
        const tooled = await runTool(mine, myConversation, 'ap_add_agent_tool', { agentId, pieceName: TOOL_PIECE, actionNames: ['save_note'] })

        expect(updated).toEqual({ error: expect.stringContaining('No agent with that id') })
        expect(tooled).toEqual({ error: expect.stringContaining('No agent with that id') })
        const stored = await agentRow(agentId)
        expect(stored.draft.instructions).toBe('Private.')
        expect(stored.published).toBeNull()
    })

    it('refuses every agent tool once the platform loses the entitlement', async () => {
        const ctx = await createTestContext(app, { plan: { agentsEnabled: false, chatEnabled: true } })
        const conversationId = await startConversation(ctx)

        for (const toolName of ['ap_list_agents', 'ap_create_agent', 'ap_update_agent', 'ap_add_agent_tool', 'ap_remove_agent_tool']) {
            const result = await runTool(ctx, conversationId, toolName, { displayName: 'x', instructions: 'y', agentId: 'z' })
            expect(result, toolName).toEqual({ error: expect.stringContaining('not available here') })
        }
    })
})
