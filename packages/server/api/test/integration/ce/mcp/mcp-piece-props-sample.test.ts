import { apId } from '@activepieces/core-utils'
import { EngineResponseStatus, McpServerType, PackageType, PieceType, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { apGetPiecePropsTool } from '../../../../src/app/mcp/tools/ap-get-piece-props'
import { apResolvePropertyChainTool } from '../../../../src/app/mcp/tools/ap-resolve-property-chain'
import { apResolvePropertyOptionsTool } from '../../../../src/app/mcp/tools/ap-resolve-property-options'
import { userInteractionWatcher } from '../../../../src/app/workers/user-interaction-watcher'
import { db } from '../../../helpers/db'
import { createMockPieceMetadata } from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
let mockLog: FastifyBaseLogger

beforeAll(async () => {
    app = await setupTestEnvironment()
    mockLog = app.log
    await db.save('piece_metadata', createMockPieceMetadata({
        name: KEYED_PIECE,
        displayName: 'Test Chat',
        version: '0.1.0',
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
        platformId: undefined,
        auth: { type: 'SECRET_TEXT', displayName: 'API key', required: true },
        actions: {
            post: {
                name: 'post',
                displayName: 'Post',
                description: 'Post a message',
                requireAuth: true,
                props: {
                    channel: { type: 'DROPDOWN', displayName: 'Channel', required: true, refreshers: ['auth'] },
                    text: { type: 'SHORT_TEXT', displayName: 'Text', required: true },
                },
            },
        },
        triggers: {
            new_message: {
                name: 'new_message',
                displayName: 'New Message',
                description: 'New message',
                requireAuth: true,
                props: {},
                sampleData: { id: 'm1', text: 'hello', user: { name: 'Ada' } },
            },
        },
    }))
})

afterEach(() => {
    vi.restoreAllMocks()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('ap_get_piece_props samples', () => {
    it('includes the trigger sample payload', async () => {
        const ctx = await createTestContext(app)

        const result = await apGetPiecePropsTool(makeMcp(ctx.project.id), mockLog).execute({ pieceName: KEYED_PIECE, actionOrTriggerName: 'new_message', type: 'trigger' })

        expect(text(result)).toContain('Sample payload')
        expect(text(result)).toContain('"name":"Ada"')
        expect(result.structuredContent).toMatchObject({ sampleOutput: expect.stringContaining('hello') })
    })
})

describe('property resolvers share one code path', () => {
    it('ap_resolve_property_options returns the chain shape for a single field', async () => {
        const ctx = await createTestContext(app)
        vi.spyOn(userInteractionWatcher, 'submitAndWaitForResponse').mockResolvedValue({ status: EngineResponseStatus.OK, response: { options: CHANNELS } })

        const result = await apResolvePropertyOptionsTool(makeMcp(ctx.project.id), mockLog).execute({ pieceName: KEYED_PIECE, actionOrTriggerName: 'post', type: 'action', propertyName: 'channel', auth: 'chat-main' })

        expect(text(result)).toContain('C2')
        expect(result.structuredContent).toEqual({ resolvedProperties: [{ propertyName: 'channel', options: CHANNELS, resolved: false }] })
    })

    it('ap_resolve_property_options explains empty options when no connection is passed', async () => {
        const ctx = await createTestContext(app)
        vi.spyOn(userInteractionWatcher, 'submitAndWaitForResponse').mockResolvedValue({ status: EngineResponseStatus.OK, response: { options: [] } })

        const result = await apResolvePropertyOptionsTool(makeMcp(ctx.project.id), mockLog).execute({ pieceName: KEYED_PIECE, actionOrTriggerName: 'post', type: 'action', propertyName: 'channel' })

        expect(text(result)).toContain('Pass the connection externalId as auth')
    })

    it('ap_resolve_property_chain picks a matched option and rejects unknown properties', async () => {
        const ctx = await createTestContext(app)
        vi.spyOn(userInteractionWatcher, 'submitAndWaitForResponse').mockResolvedValue({ status: EngineResponseStatus.OK, response: { options: CHANNELS } })
        const tool = apResolvePropertyChainTool(makeMcp(ctx.project.id), mockLog)

        const picked = await tool.execute({ pieceName: KEYED_PIECE, actionOrTriggerName: 'post', type: 'action', auth: 'chat-main', propertyChain: [{ propertyName: 'channel', match: 'random' }] })
        const missing = await tool.execute({ pieceName: KEYED_PIECE, actionOrTriggerName: 'post', type: 'action', auth: 'chat-main', propertyChain: [{ propertyName: 'nope' }] })

        expect(picked.structuredContent).toMatchObject({ resolvedProperties: [{ propertyName: 'channel', selectedValue: 'C2', pickedBy: 'match', resolved: true }] })
        expect(text(missing)).toContain('❌ Property "nope" not found')
    })
})

function makeMcp(projectId: string): ProjectScopedMcpServer {
    return {
        id: apId(),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        projectId,
        platformId: null,
        type: McpServerType.PROJECT,
        token: apId(),
        disabledTools: null,
    }
}

function text(result: { content: Array<{ type: 'text', text: string }> }): string {
    return result.content.map((c) => c.text).join('\n')
}

const KEYED_PIECE = '@activepieces/piece-test-chat-props'
const CHANNELS = [{ label: 'general', value: 'C1' }, { label: 'random', value: 'C2' }]
