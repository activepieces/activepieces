import fs from 'fs'
import path from 'path'
import { apId, LocalesEnum } from '@activepieces/core-utils'
import { PackageType, PieceType, PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { pieceCache } from '../../../../src/app/pieces/metadata/piece-cache'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import { createMockPieceMetadata } from '../../../helpers/mocks'
import { setupTestEnvironment } from '../../../helpers/test-setup'

const corpus = process.env.PIECE_CORPUS_DIR

let app: FastifyInstance
let token: string

beforeAll(async () => {
    if (!corpus) {
        return
    }
    app = await setupTestEnvironment()
    const rows = fs.readdirSync(corpus).sort().map((file, index) => {
        const piece = JSON.parse(fs.readFileSync(path.join(corpus, file), 'utf8'))
        return {
            id: `race${String(index).padStart(17, '0')}`,
            created: piece.created, updated: piece.updated, name: piece.name,
            authors: piece.authors ?? [], displayName: piece.displayName, logoUrl: piece.logoUrl,
            projectUsage: 0, description: piece.description ?? null, platformId: null,
            version: piece.version,
            minimumSupportedRelease: piece.minimumSupportedRelease ?? '0.0.0',
            maximumSupportedRelease: piece.maximumSupportedRelease ?? '99999.99999.9999',
            auth: piece.auth ?? null, actions: piece.actions ?? {}, triggers: piece.triggers ?? {},
            pieceType: piece.pieceType, categories: piece.categories ?? null,
            deprecated: piece.deprecated ?? null, packageType: piece.packageType,
            archiveId: null, i18n: piece.i18n ?? null,
        }
    })
    await databaseConnection().query('TRUNCATE TABLE piece_metadata CASCADE')
    const repo = databaseConnection().getRepository('piece_metadata')
    for (let index = 0; index < rows.length; index += 50) {
        await repo.insert(rows.slice(index, index + 50))
    }
    await pieceCache(app.log!).setup()
    token = await generateMockToken({ type: PrincipalType.UNKNOWN, id: apId() })
}, 600000)

const listPieces = async (): Promise<{ name: string }[]> => {
    const response = await app.inject({
        method: 'GET',
        url: '/api/v1/pieces?locale=de',
        headers: { authorization: `Bearer ${token}` },
    })
    expect(response.statusCode).toBe(200)
    return response.json()
}

describe.skipIf(!corpus)('catalogue fill racing an invalidation', () => {
    it('does not serve a fill that started before the invalidation', async () => {
        await pieceCache(app.log!).invalidate()
        await listPieces()
        await pieceCache(app.log!).invalidate()

        const startedBeforeTheWrite = listPieces()
        await new Promise((resolve) => setImmediate(resolve))

        await db.save('piece_metadata', createMockPieceMetadata({
            name: '@race/added-mid-fill', displayName: 'Added Mid Fill', description: 'Send a message',
            pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY,
            i18n: { [LocalesEnum.GERMAN]: { 'Send a message': 'Ganz neu' } },
        }))
        await pieceCache(app.log!).invalidate()

        const arrivedAfterTheWrite = await listPieces()
        await startedBeforeTheWrite

        expect(arrivedAfterTheWrite.map((piece) => piece.name)).toContain('@race/added-mid-fill')
        expect((await listPieces()).map((piece) => piece.name)).toContain('@race/added-mid-fill')
    }, 600000)
})
