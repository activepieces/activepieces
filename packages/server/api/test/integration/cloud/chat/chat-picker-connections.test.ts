import { AppConnectionType, PackageType } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { pieceMetadataService } from '../../../../src/app/pieces/metadata/piece-metadata-service'
import { db } from '../../../helpers/db'
import { createMockPieceMetadata } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
let mockLog: FastifyBaseLogger

beforeAll(async () => {
    app = await setupTestEnvironment()
    mockLog = app.log
})

afterAll(async () => {
    await teardownTestEnvironment()
})

const ATTIO_PIECE = '@activepieces/piece-attio'

async function seedAttioConnections(ctx: TestContext, count: number): Promise<void> {
    const meta = createMockPieceMetadata({
        platformId: ctx.platform.id,
        packageType: PackageType.REGISTRY,
        name: ATTIO_PIECE,
        displayName: 'Attio',
    })
    await db.save('piece_metadata', meta)
    pieceMetadataService(mockLog).getOrThrow = vi.fn().mockResolvedValue(meta)
    for (let i = 1; i <= count; i++) {
        const response = await ctx.post('/v1/app-connections', {
            externalId: `attio-${i}`,
            displayName: `Attio Account ${i}`,
            pieceName: ATTIO_PIECE,
            projectId: ctx.project.id,
            type: AppConnectionType.SECRET_TEXT,
            value: { type: AppConnectionType.SECRET_TEXT, secret_text: 'secret' },
            pieceVersion: meta.version,
        })
        expect(response.statusCode).toBe(StatusCodes.CREATED)
    }
}

async function createConversationId(ctx: TestContext): Promise<string> {
    const response = await ctx.post('/v1/chat/conversations', {})
    expect(response.statusCode).toBe(StatusCodes.CREATED)
    return response.json().id
}

describe('Chat picker connections resolver', () => {
    it('surfaces the user connections for a mis-cased piece hint (the reported bug)', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })
        await seedAttioConnections(ctx, 2)
        const conversationId = await createConversationId(ctx)

        const response = await ctx.get(
            `/v1/chat/conversations/${conversationId}/connections`,
            { pieceName: 'Attio', displayName: 'Attio' },
        )

        expect(response.statusCode).toBe(StatusCodes.OK)
        const body = response.json()
        expect(body.fallback).toBe(false)
        expect(body.connections).toHaveLength(2)
    })

    it('resolves a hallucinated piece name against the user connections', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })
        await seedAttioConnections(ctx, 2)
        const conversationId = await createConversationId(ctx)

        const response = await ctx.get(
            `/v1/chat/conversations/${conversationId}/connections`,
            { pieceName: 'attioApp' },
        )

        expect(response.statusCode).toBe(StatusCodes.OK)
        const body = response.json()
        expect(body.connections).toHaveLength(2)
        expect(body.fallback).toBe(false)
    })

    it('never returns a false empty — falls back to the user connections for an unknown app', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })
        await seedAttioConnections(ctx, 2)
        const conversationId = await createConversationId(ctx)

        const response = await ctx.get(
            `/v1/chat/conversations/${conversationId}/connections`,
            { pieceName: 'totally-unknown-service', displayName: 'TotallyUnknown' },
        )

        expect(response.statusCode).toBe(StatusCodes.OK)
        const body = response.json()
        expect(body.fallback).toBe(true)
        expect(body.connections.length).toBeGreaterThan(0)
    })
})
