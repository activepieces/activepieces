import { ActionBase } from '@activepieces/pieces-framework'
import { PackageType, PieceType } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { pieceSyncService } from '../../../../src/app/pieces/piece-sync-service'
import { createMockPieceMetadata } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

vi.hoisted(() => {
    process.env.AP_PIECES_SYNC_MODE = 'OFFICIAL_AUTO'
})

const CLOUD_PIECES_URL = 'https://cloud.activepieces.com/api/v1/pieces'
const PIECE_NAME = '@activepieces/piece-audience-sync-probe'
const PIECE_VERSION = '1.0.0'

let app: FastifyInstance | null = null
let mockLog: FastifyBaseLogger

function mockAction(name: string, audience: 'human' | 'ai' | 'both'): ActionBase {
    return {
        name,
        displayName: name,
        description: `${name} description`,
        props: {},
        requireAuth: false,
        audience,
    } as ActionBase
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

beforeAll(async () => {
    stubCloudFetch()
    app = await setupTestEnvironment()
    mockLog = app!.log!
})

afterAll(async () => {
    vi.unstubAllGlobals()
    await teardownTestEnvironment()
})

beforeEach(async () => {
    await databaseConnection().getRepository('piece_metadata').createQueryBuilder().delete().execute()
})

describe('Piece Sync Audience', () => {
    it('stores every action of a synced piece, including audience ai', async () => {
        await pieceSyncService(mockLog).sync({ publishCacheRefresh: false })

        const stored = await databaseConnection().getRepository('piece_metadata').findOneByOrFail({
            name: PIECE_NAME,
            version: PIECE_VERSION,
        })

        expect(Object.keys(stored.actions).sort()).toEqual(['ai_action', 'human_action', 'shared_action'])
    })
})
