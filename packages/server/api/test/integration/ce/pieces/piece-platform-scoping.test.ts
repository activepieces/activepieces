import { apId, LocalesEnum } from '@activepieces/core-utils'
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework'
import { PackageType, PieceType, PrincipalType } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { pieceCache } from '../../../../src/app/pieces/metadata/piece-cache'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import { createMockPieceMetadata, mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
let log: FastifyBaseLogger

const DE = { 'Send a message': 'Eine Nachricht senden' }

beforeAll(async () => {
    app = await setupTestEnvironment()
    log = app.log!
})

beforeEach(async () => {
    await databaseConnection().getRepository('piece_metadata').createQueryBuilder().delete().execute()
    await pieceCache(log).invalidate()
})

async function scenario() {
    const a = await mockAndSaveBasicSetup()
    const b = await mockAndSaveBasicSetup()

    await db.save('piece_metadata', createMockPieceMetadata({
        name: '@ap/official', displayName: 'Official', description: 'Send a message',
        pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY,
        platformId: undefined, i18n: { [LocalesEnum.GERMAN]: DE },
    }))
    await db.save('piece_metadata', createMockPieceMetadata({
        name: '@ap/custom-a', displayName: 'Custom A', description: 'Send a message',
        pieceType: PieceType.CUSTOM, packageType: PackageType.ARCHIVE,
        platformId: a.mockPlatform.id, i18n: { [LocalesEnum.GERMAN]: DE },
    }))
    await db.save('piece_metadata', createMockPieceMetadata({
        name: '@ap/custom-b', displayName: 'Custom B', description: 'Send a message',
        pieceType: PieceType.CUSTOM, packageType: PackageType.ARCHIVE,
        platformId: b.mockPlatform.id, i18n: { [LocalesEnum.GERMAN]: DE },
    }))
    await pieceCache(log).invalidate()

    const tokenA = await generateMockToken({ type: PrincipalType.USER, id: a.mockOwner.id, platform: { id: a.mockPlatform.id }, projectId: a.mockProject.id })
    const tokenB = await generateMockToken({ type: PrincipalType.USER, id: b.mockOwner.id, platform: { id: b.mockPlatform.id }, projectId: b.mockProject.id })
    return { a, b, tokenA, tokenB }
}

const get = async (url: string, token: string) => {
    const res = await app.inject({ method: 'GET', url, headers: { authorization: `Bearer ${token}` } })
    return { status: res.statusCode, body: res.statusCode === 200 ? res.json() : res.body }
}

const getList = async (url: string, token: string): Promise<PieceMetadataModelSummary[]> => {
    const res = await app.inject({ method: 'GET', url, headers: { authorization: `Bearer ${token}` } })
    expect(res.statusCode).toBe(200)
    return res.json<PieceMetadataModelSummary[]>()
}

describe('custom pieces per platform', () => {
    it('list: each platform sees official + only its own custom piece, all translated', async () => {
        const { a, b, tokenA, tokenB } = await scenario()

        const listA = await getList(`/api/v1/pieces?locale=de&projectId=${a.mockProject.id}`, tokenA)
        expect(listA.map((piece) => piece.name).sort()).toEqual(['@ap/custom-a', '@ap/official'])
        for (const piece of listA) expect(piece.description).toBe('Eine Nachricht senden')

        const listB = await getList(`/api/v1/pieces?locale=de&projectId=${b.mockProject.id}`, tokenB)
        expect(listB.map((piece) => piece.name).sort()).toEqual(['@ap/custom-b', '@ap/official'])
        for (const piece of listB) expect(piece.description).toBe('Eine Nachricht senden')
    })

    it('list: the shared cache does not leak platform B custom piece into platform A', async () => {
        const { a, b, tokenA, tokenB } = await scenario()
        await get(`/api/v1/pieces?locale=de&projectId=${b.mockProject.id}`, tokenB)
        const listA = await getList(`/api/v1/pieces?locale=de&projectId=${a.mockProject.id}`, tokenA)
        expect(listA.map((piece) => piece.name)).not.toContain('@ap/custom-b')
    })

    it('single piece: a platform user gets an OFFICIAL piece translated', async () => {
        const { a, tokenA } = await scenario()
        const r = await get(`/api/v1/pieces/@ap/official?locale=de&excludeTranslations=true&projectId=${a.mockProject.id}`, tokenA)
        expect(r.status).toBe(200)
        expect(r.body.description).toBe('Eine Nachricht senden')
        expect(r.body.i18n).toBeUndefined()
    })

    it('single piece: a platform user gets their OWN CUSTOM piece translated', async () => {
        const { a, tokenA } = await scenario()
        const r = await get(`/api/v1/pieces/@ap/custom-a?locale=de&excludeTranslations=true&projectId=${a.mockProject.id}`, tokenA)
        expect(r.status).toBe(200)
        expect(r.body.description).toBe('Eine Nachricht senden')
        expect(r.body.i18n).toBeUndefined()
    })

    it('single piece: the unscoped route also translates for a platform user', async () => {
        const a = await mockAndSaveBasicSetup()
        await db.save('piece_metadata', createMockPieceMetadata({
            name: 'unscoped-official', displayName: 'Unscoped', description: 'Send a message',
            pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY,
            platformId: undefined, i18n: { [LocalesEnum.GERMAN]: DE },
        }))
        await db.save('piece_metadata', createMockPieceMetadata({
            name: 'unscoped-custom', displayName: 'Unscoped Custom', description: 'Send a message',
            pieceType: PieceType.CUSTOM, packageType: PackageType.ARCHIVE,
            platformId: a.mockPlatform.id, i18n: { [LocalesEnum.GERMAN]: DE },
        }))
        await pieceCache(log).invalidate()
        const token = await generateMockToken({ type: PrincipalType.USER, id: a.mockOwner.id, platform: { id: a.mockPlatform.id }, projectId: a.mockProject.id })

        for (const name of ['unscoped-official', 'unscoped-custom']) {
            const r = await get(`/api/v1/pieces/${name}?locale=de&excludeTranslations=true&projectId=${a.mockProject.id}`, token)
            expect(r.status).toBe(200)
            expect(r.body.description).toBe('Eine Nachricht senden')
            expect(r.body.i18n).toBeUndefined()
        }
    })

    it('single piece: an English request is unaffected and carries no i18n', async () => {
        const { a, tokenA } = await scenario()
        for (const name of ['@ap/official', '@ap/custom-a']) {
            const r = await get(`/api/v1/pieces/${name}?locale=en&excludeTranslations=true&projectId=${a.mockProject.id}`, tokenA)
            expect(r.status).toBe(200)
            expect(r.body.description).toBe('Send a message')
            expect(r.body.i18n).toBeUndefined()
        }
    })

    it('single piece: the translations ship by default, which is how self-hosters sync them', async () => {
        const { a, tokenA } = await scenario()
        for (const name of ['@ap/official', '@ap/custom-a']) {
            const r = await get(`/api/v1/pieces/${name}?projectId=${a.mockProject.id}`, tokenA)
            expect(r.status).toBe(200)
            expect(r.body.description).toBe('Send a message')
            expect(r.body.i18n).toEqual({ [LocalesEnum.GERMAN]: DE })
        }
    })

    it('single piece: a translated response still carries every locale, not only the one asked for', async () => {
        const a = await mockAndSaveBasicSetup()
        await db.save('piece_metadata', createMockPieceMetadata({
            name: 'multi-locale', displayName: 'Multi', description: 'Send a message',
            pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY, platformId: undefined,
            i18n: { [LocalesEnum.GERMAN]: DE, [LocalesEnum.FRENCH]: { 'Send a message': 'Envoyer un message' } },
        }))
        await pieceCache(log).invalidate()
        const token = await generateMockToken({ type: PrincipalType.USER, id: a.mockOwner.id, platform: { id: a.mockPlatform.id }, projectId: a.mockProject.id })

        const r = await get(`/api/v1/pieces/multi-locale?locale=de&projectId=${a.mockProject.id}`, token)
        expect(r.status).toBe(200)
        expect(r.body.description).toBe('Eine Nachricht senden')
        expect(r.body.i18n).toEqual({
            [LocalesEnum.GERMAN]: DE,
            [LocalesEnum.FRENCH]: { 'Send a message': 'Envoyer un message' },
        })
    })

    it('single piece: a platform user cannot read another platform custom piece', async () => {
        const { a, tokenA } = await scenario()
        const r = await get(`/api/v1/pieces/@ap/custom-b?locale=de&projectId=${a.mockProject.id}`, tokenA)
        expect(r.status).not.toBe(200)
    })
})
