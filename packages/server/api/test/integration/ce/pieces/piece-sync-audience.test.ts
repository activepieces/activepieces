import { ActionBase, Audience } from '@activepieces/pieces-framework'
import { PackageType, PieceType } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { pieceCache } from '../../../../src/app/pieces/metadata/piece-cache'
import { pieceRepos } from '../../../../src/app/pieces/metadata/piece-metadata-service'
import { pieceSyncService } from '../../../../src/app/pieces/piece-sync-service'
import { createMockPieceMetadata } from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const originalSyncMode = vi.hoisted(() => {
    const previous = process.env.AP_PIECES_SYNC_MODE
    process.env.AP_PIECES_SYNC_MODE = 'OFFICIAL_AUTO'
    return previous
})

const CLOUD_PIECES_URL = 'https://cloud.activepieces.com/api/v1/pieces'
const PIECE_NAME = '@activepieces/piece-audience-sync-probe'
const PIECE_VERSION = '1.0.0'

let app: FastifyInstance
let mockLog: FastifyBaseLogger

function mockAction(name: string, audience: Audience): ActionBase {
    return {
        name,
        displayName: name,
        description: `${name} description`,
        props: {},
        requireAuth: false,
        audience,
    }
}

const cloudPiece = createMockPieceMetadata({
    name: PIECE_NAME,
    version: PIECE_VERSION,
    pieceType: PieceType.OFFICIAL,
    packageType: PackageType.REGISTRY,
    actions: {
        human_action: mockAction('human_action', 'human'),
        ai_action: mockAction('ai_action', 'ai'),
        shared_action: mockAction('shared_action', 'both'),
    },
})

function applyCloudAudienceFilter(audience: string | null): typeof cloudPiece {
    if (audience === 'all') {
        return cloudPiece
    }
    return {
        ...cloudPiece,
        actions: Object.fromEntries(
            Object.entries(cloudPiece.actions).filter(([, action]) => action.audience !== 'ai'),
        ),
    }
}

function jsonResponse(body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'content-type': 'application/json' },
    })
}

function stubCloudFetch(): void {
    const realFetch = globalThis.fetch
    vi.stubGlobal('fetch', async (input: string | URL | Request, init?: RequestInit) => {
        const target = input instanceof Request ? input.url : String(input)
        if (!target.startsWith(CLOUD_PIECES_URL)) {
            return realFetch(input, init)
        }
        const url = new URL(target)
        if (url.pathname === '/api/v1/pieces/registry') {
            return jsonResponse([{ name: PIECE_NAME, version: PIECE_VERSION }])
        }
        if (url.pathname === `/api/v1/pieces/${PIECE_NAME}`) {
            return jsonResponse(applyCloudAudienceFilter(url.searchParams.get('audience')))
        }
        return jsonResponse({ message: 'not found' })
    })
}

// setup() fires an unawaited boot sync; let it finish before tests truncate and
// re-sync, so it can't race them or outlive the fetch stub.
async function settleBootSync(): Promise<void> {
    const deadline = Date.now() + 15_000
    while (Date.now() < deadline) {
        const row = await pieceRepos().findOneBy({ name: PIECE_NAME, version: PIECE_VERSION })
        if (row !== null) {
            return
        }
        await new Promise(resolve => setTimeout(resolve, 100))
    }
    throw new Error('Boot piece sync did not settle in time')
}

beforeAll(async () => {
    stubCloudFetch()
    app = await setupTestEnvironment({ fresh: true })
    mockLog = app.log
    await settleBootSync()
})

afterAll(async () => {
    vi.unstubAllGlobals()
    if (originalSyncMode === undefined) {
        delete process.env.AP_PIECES_SYNC_MODE
    }
    else {
        process.env.AP_PIECES_SYNC_MODE = originalSyncMode
    }
    await teardownTestEnvironment()
})

beforeEach(async () => {
    await pieceRepos().createQueryBuilder().delete().execute()
})

describe('Piece Sync Audience', () => {
    it('stores every action of a synced piece, including audience ai', async () => {
        await pieceSyncService(mockLog).sync({ publishCacheRefresh: false })

        const stored = await pieceRepos().findOneByOrFail({
            name: PIECE_NAME,
            version: PIECE_VERSION,
        })

        expect(Object.keys(stored.actions).sort()).toEqual(['ai_action', 'human_action', 'shared_action'])
    })

    it('keeps ai actions hidden from the default read paths', async () => {
        await pieceSyncService(mockLog).sync({ publishCacheRefresh: false })
        await pieceCache(mockLog).setup()
        const ctx = await createTestContext(app)

        const getResponse = await ctx.get(`/v1/pieces/${PIECE_NAME}`)
        expect(getResponse.statusCode).toBe(StatusCodes.OK)
        const piece: { actions: Record<string, ActionBase> } = getResponse.json()
        expect(Object.keys(piece.actions).sort()).toEqual(['human_action', 'shared_action'])

        const listResponse = await ctx.get('/v1/pieces')
        expect(listResponse.statusCode).toBe(StatusCodes.OK)
        const summaries: { name: string, actions: number }[] = listResponse.json()
        const summary = summaries.find(item => item.name === PIECE_NAME)
        expect(summary?.actions).toBe(2)
    })
})
