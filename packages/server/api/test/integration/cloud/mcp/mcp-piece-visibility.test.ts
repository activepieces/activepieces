import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import {
    apId,
    FilteredPieceBehavior,
    McpServerType,
    PackageType,
    PieceType,
    ProjectScopedMcpServer,
} from '@activepieces/shared'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { createTestContext } from '../../../helpers/test-context'
import { db } from '../../../helpers/db'
import { createMockPieceMetadata } from '../../../helpers/mocks'
import { pieceCache } from '../../../../src/app/pieces/metadata/piece-cache'
import { apListPiecesTool } from '../../../../src/app/mcp/tools/ap-list-pieces'

let app: FastifyInstance
let mockLog: FastifyBaseLogger

beforeAll(async () => {
    app = await setupTestEnvironment()
    mockLog = app.log
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('MCP piece visibility', () => {
    it('ap_list_pieces — does NOT return pieces hidden by platform admin (BLOCKED behavior)', async () => {
        const blockedPieceName = '@activepieces/piece-hidden-by-admin'

        const ctx = await createTestContext(app, {
            platform: {
                filteredPieceBehavior: FilteredPieceBehavior.BLOCKED,
                filteredPieceNames: [blockedPieceName],
            },
        })
        const mcp = makeMcp(ctx.project.id)

        const blockedPiece = createMockPieceMetadata({
            name: blockedPieceName,
            displayName: 'Hidden By Admin',
            version: '0.1.0',
            pieceType: PieceType.OFFICIAL,
            packageType: PackageType.REGISTRY,
            platformId: undefined,
            actions: {},
            triggers: {},
        })
        await db.save('piece_metadata', blockedPiece)
        await pieceCache(mockLog).setup()

        const result = await apListPiecesTool(mcp, mockLog).execute({})

        expect(text(result)).toContain('✅')
        expect(text(result)).not.toContain(blockedPieceName)
    })

    it('ap_list_pieces — returns pieces NOT in the platform blocklist', async () => {
        const visiblePieceName = '@activepieces/piece-visible'

        const ctx = await createTestContext(app, {
            platform: {
                filteredPieceBehavior: FilteredPieceBehavior.BLOCKED,
                filteredPieceNames: ['@activepieces/piece-something-else'],
            },
        })
        const mcp = makeMcp(ctx.project.id)

        const visiblePiece = createMockPieceMetadata({
            name: visiblePieceName,
            displayName: 'Visible Piece',
            version: '0.1.0',
            pieceType: PieceType.OFFICIAL,
            packageType: PackageType.REGISTRY,
            platformId: undefined,
            actions: {},
            triggers: {},
        })
        await db.save('piece_metadata', visiblePiece)
        await pieceCache(mockLog).setup()

        const result = await apListPiecesTool(mcp, mockLog).execute({})

        expect(text(result)).toContain('✅')
        expect(text(result)).toContain(visiblePieceName)
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
    return result.content.map(c => c.text).join('\n')
}
