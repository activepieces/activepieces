import { AgentIcon, AgentRunSource, ColorName, DefaultProjectRole, PackageType, PieceType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { agentRpcHandlers } from '../../../../src/app/ee/agent/agent-rpc-handlers'
import { encryptUtils } from '../../../../src/app/helper/encryption'
import { db } from '../../../helpers/db'
import { createMockConnection, createMockPieceMetadata } from '../../../helpers/mocks'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

const MAILER = '@activepieces/piece-test-pinmail'
const OTHER = '@activepieces/piece-test-pinchat'

const action = (name: string) => ({ name, displayName: name, description: name, requireAuth: true, props: {} })

beforeAll(async () => {
    process.env.AP_AGENTS_ENABLED = 'true'
    app = await setupTestEnvironment()
    for (const name of [MAILER, OTHER]) {
        await db.save('piece_metadata', createMockPieceMetadata({
            name,
            displayName: name,
            version: '1.0.0',
            pieceType: PieceType.OFFICIAL,
            packageType: PackageType.REGISTRY,
            platformId: undefined,
            auth: { type: 'SECRET_TEXT', displayName: 'Key', required: true },
            actions: { send: action('send') },
        }))
    }
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function context(): Promise<TestContext> {
    return createTestContext(app, { plan: { agentsEnabled: true, chatEnabled: true } })
}

async function saveConnection({ ctx, pieceName }: { ctx: TestContext, pieceName: string }) {
    const connection = createMockConnection({ platformId: ctx.platform.id, projectIds: [ctx.project.id], pieceName, displayName: pieceName }, ctx.user.id)
    await db.save('app_connection', { ...connection, value: await encryptUtils.encryptObject(connection.value) })
    return connection
}

async function agentWithUnpinnedTool(ctx: TestContext) {
    const response = await ctx.post('/v1/agents', {
        projectId: ctx.project.id,
        displayName: 'Pinner',
        description: null,
        icon: AgentIcon.SPARKLES,
        color: ColorName.PURPLE,
        draft: {
            instructions: 'Handle mail.',
            provider: null,
            modelName: null,
            maxSteps: 5,
            structuredOutput: [],
            tools: [{
                type: 'PIECE',
                toolName: 'pinmail-send',
                pieceMetadata: { pieceName: MAILER, pieceVersion: '1.0.0', actionName: 'send' },
            }],
        },
    })
    expect(response.statusCode).toBe(StatusCodes.CREATED)
    return response.json()
}

async function conversationFor({ ctx, agentId }: { ctx: TestContext, agentId: string }): Promise<string> {
    const response = await ctx.post('/v1/agents/conversations', { agentId })
    expect(response.statusCode).toBe(StatusCodes.CREATED)
    return response.json().id
}

async function selectConnection({ ctx, conversationId, pieceName, externalId }: { ctx: TestContext, conversationId: string, pieceName: string, externalId: string }) {
    await agentRpcHandlers(app.log).executeAgentTool({
        toolName: '__store_selected_connection',
        toolInput: { pieceName, connectionExternalId: externalId, label: 'chosen', projectId: ctx.project.id },
        source: AgentRunSource.AGENT,
        conversationId,
        platformId: ctx.platform.id,
        userId: ctx.user.id,
    })
}

async function pinnedAuthOn(id: string): Promise<(string | undefined)[]> {
    const row = await db.findOneByOrFail<{ draft: { tools: Array<{ pieceMetadata?: { predefinedInput?: { auth?: string } } }> } }>('agent', { id })
    return row.draft.tools.map((tool) => tool.pieceMetadata?.predefinedInput?.auth)
}

describe('pinning an account chosen mid-conversation', () => {
    it('writes the account onto the agent, so the next conversation does not ask again', async () => {
        const ctx = await context()
        const agent = await agentWithUnpinnedTool(ctx)
        const connection = await saveConnection({ ctx, pieceName: MAILER })
        const conversationId = await conversationFor({ ctx, agentId: agent.id })

        await selectConnection({ ctx, conversationId, pieceName: MAILER, externalId: connection.externalId })

        expect(await pinnedAuthOn(agent.id)).toStrictEqual([connection.externalId])
    })

    it('refuses a connection for a different app, which would hand one provider its rival credential', async () => {
        const ctx = await context()
        const agent = await agentWithUnpinnedTool(ctx)
        const wrongApp = await saveConnection({ ctx, pieceName: OTHER })
        const conversationId = await conversationFor({ ctx, agentId: agent.id })

        await selectConnection({ ctx, conversationId, pieceName: MAILER, externalId: wrongApp.externalId })

        expect(await pinnedAuthOn(agent.id)).toStrictEqual([undefined])
    })

    it('refuses an externalId that does not exist in the agent project', async () => {
        const ctx = await context()
        const agent = await agentWithUnpinnedTool(ctx)
        const conversationId = await conversationFor({ ctx, agentId: agent.id })

        await selectConnection({ ctx, conversationId, pieceName: MAILER, externalId: 'invented-external-id' })

        expect(await pinnedAuthOn(agent.id)).toStrictEqual([undefined])
    })

    it('refuses an externalId that lives in another project, since the id is not unique', async () => {
        const ctx = await context()
        const other = await context()
        const agent = await agentWithUnpinnedTool(ctx)
        const theirs = await saveConnection({ ctx: other, pieceName: MAILER })
        const conversationId = await conversationFor({ ctx, agentId: agent.id })

        await selectConnection({ ctx, conversationId, pieceName: MAILER, externalId: theirs.externalId })

        expect(await pinnedAuthOn(agent.id)).toStrictEqual([undefined])
    })

    it('refuses a viewer, who may talk to a shared agent but not change what it runs on', async () => {
        const owner = await context()
        const viewer = await createMemberContext(app, owner, { projectRole: DefaultProjectRole.VIEWER })
        const agent = await agentWithUnpinnedTool(owner)
        const connection = await saveConnection({ ctx: owner, pieceName: MAILER })
        const conversationId = await conversationFor({ ctx: viewer, agentId: agent.id })

        await selectConnection({ ctx: viewer, conversationId, pieceName: MAILER, externalId: connection.externalId })

        expect(await pinnedAuthOn(agent.id)).toStrictEqual([undefined])
    })

    it('still lets an editor pin, so the guard is not simply refusing everyone', async () => {
        const owner = await context()
        const editor = await createMemberContext(app, owner, { projectRole: DefaultProjectRole.EDITOR })
        const agent = await agentWithUnpinnedTool(owner)
        const connection = await saveConnection({ ctx: owner, pieceName: MAILER })
        const conversationId = await conversationFor({ ctx: editor, agentId: agent.id })

        await selectConnection({ ctx: editor, conversationId, pieceName: MAILER, externalId: connection.externalId })

        expect(await pinnedAuthOn(agent.id)).toStrictEqual([connection.externalId])
    })
})
