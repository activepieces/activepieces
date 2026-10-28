import { apId } from '@activepieces/core-utils'
import { AppConnectionStatus, EngineResponseStatus, McpServerType, PackageType, PieceType, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { apGetPiecePropsTool, pieceConnections } from '../../../../src/app/mcp/tools/ap-get-piece-props'
import { userInteractionWatcher } from '../../../../src/app/workers/user-interaction-watcher'
import { db } from '../../../helpers/db'
import { createMockConnection, createMockPieceMetadata } from '../../../helpers/mocks'
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
    await db.save('piece_metadata', createMockPieceMetadata({
        name: OTHER_PIECE,
        displayName: 'Test Mail',
        version: '0.1.0',
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
        platformId: undefined,
        auth: { type: 'SECRET_TEXT', displayName: 'API key', required: true },
        actions: { send: { name: 'send', displayName: 'Send', description: 'Send', requireAuth: true, props: {} } },
        triggers: {},
    }))
})

afterEach(() => {
    vi.restoreAllMocks()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('ap_get_piece_props connections and samples', () => {
    it('lists the project connections of every piece in one batch, with a hint for pieces that have none', async () => {
        const ctx = await createTestContext(app)
        const other = await createTestContext(app)
        await db.save('app_connection', [
            createMockConnection({ platformId: ctx.platform.id, projectIds: [ctx.project.id], pieceName: KEYED_PIECE, displayName: 'Team Chat', externalId: 'chat-main', status: AppConnectionStatus.ACTIVE }, ctx.user.id),
            createMockConnection({ platformId: other.platform.id, projectIds: [other.project.id], pieceName: KEYED_PIECE, displayName: 'Foreign', externalId: 'chat-foreign' }, other.user.id),
        ])

        const result = await apGetPiecePropsTool(makeMcp(ctx.project.id), mockLog).execute({
            items: [
                { pieceName: KEYED_PIECE, actionOrTriggerName: 'new_message', type: 'trigger' },
                { pieceName: KEYED_PIECE, actionOrTriggerName: 'post', type: 'action' },
                { pieceName: OTHER_PIECE, actionOrTriggerName: 'send', type: 'action' },
            ],
        })

        const output = text(result)
        expect(output).toContain('"Team Chat" = chat-main')
        expect(output).not.toContain('chat-foreign')
        expect(output).toContain(`${OTHER_PIECE}: none yet`)
        expect(output.match(/Project connections/g)).toHaveLength(1)
        expect(result.structuredContent).toMatchObject({
            connections: {
                [KEYED_PIECE]: [{ externalId: 'chat-main', displayName: 'Team Chat', status: AppConnectionStatus.ACTIVE }],
                [OTHER_PIECE]: [],
            },
        })
    })

    it('includes the trigger sample payload', async () => {
        const ctx = await createTestContext(app)

        const result = await apGetPiecePropsTool(makeMcp(ctx.project.id), mockLog).execute({ pieceName: KEYED_PIECE, actionOrTriggerName: 'new_message', type: 'trigger' })

        expect(text(result)).toContain('Sample payload')
        expect(text(result)).toContain('"name":"Ada"')
        expect(result.structuredContent).toMatchObject({ sampleOutput: expect.stringContaining('hello'), connections: { [KEYED_PIECE]: [] } })
    })
})

describe('pieceConnections', () => {
    it('groups connections per requested piece, keeping pieces with none', () => {
        const grouped = pieceConnections.groupByPiece({
            pieceNames: ['@activepieces/piece-slack', '@activepieces/piece-gmail'],
            connections: [{ externalId: 's1', displayName: 'Team Slack', status: AppConnectionStatus.ACTIVE, pieceName: '@activepieces/piece-slack' }],
        })
        expect(grouped).toEqual({
            '@activepieces/piece-slack': [{ externalId: 's1', displayName: 'Team Slack', status: AppConnectionStatus.ACTIVE }],
            '@activepieces/piece-gmail': [],
        })
        const text = pieceConnections.formatSection({ connectionsByPiece: grouped })
        expect(text).toContain('"Team Slack" = s1')
        expect(text).toContain('@activepieces/piece-gmail: none yet')
    })

    it('flags connections that are not active', () => {
        const text = pieceConnections.formatSection({ connectionsByPiece: { p: [{ externalId: 'e', displayName: 'Old', status: AppConnectionStatus.ERROR }] } })
        expect(text).toContain('(ERROR)')
    })
})
