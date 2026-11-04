import { apId } from '@activepieces/core-utils'
import { McpServerType, PackageType, PieceType, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { apGetPiecePropsTool } from '../../../../src/app/mcp/tools/ap-get-piece-props'
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
