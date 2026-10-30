import { apId, LocalesEnum } from '@activepieces/core-utils'
import { PackageType, PieceSyncMode, PieceType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { backgroundMigrationRunner } from '../../../../src/app/database/background-migration-runner'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { RefetchMissingPieceTranslations1879000000000 } from '../../../../src/app/database/migration/postgres/background/1879000000000-RefetchMissingPieceTranslations'
import { pieceMetadataService } from '../../../../src/app/pieces/metadata/piece-metadata-service'
import { createMockPieceMetadata } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }))

vi.mock('@activepieces/server-utils', async (importOriginal) => {
    const original = await importOriginal<typeof import('@activepieces/server-utils')>()
    return {
        ...original,
        safeHttp: { ...original.safeHttp, axios: { get: getMock } },
    }
})

const REGISTRY_I18N = {
    [LocalesEnum.GERMAN]: { 'Send a message': 'Eine Nachricht senden' },
    [LocalesEnum.JAPANESE]: { 'Send a message': 'メッセージを送信' },
}

const brokenOffered = officialPiece({ name: '@activepieces/piece-refetch-offered', version: '0.23.1', created: '2023-06-05T00:00:00.000Z' })
const brokenWithdrawn = officialPiece({ name: '@activepieces/piece-refetch-withdrawn', version: '0.1.0' })
const brokenFetchFails = officialPiece({ name: '@activepieces/piece-refetch-unreachable', version: '1.0.0' })
const untranslatedUpstream = officialPiece({ name: '@activepieces/piece-refetch-untranslated', version: '2.0.0' })
const alreadyTranslated = officialPiece({ name: '@activepieces/piece-refetch-translated', version: '3.0.0', i18n: REGISTRY_I18N })
const customPiece = createMockPieceMetadata({ name: '@activepieces/piece-refetch-custom', version: '4.0.0', pieceType: PieceType.CUSTOM, packageType: PackageType.REGISTRY, platformId: apId(), i18n: undefined })

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
    await backgroundMigrationRunner.ensureTable()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    process.env.AP_PIECES_SYNC_MODE = PieceSyncMode.OFFICIAL_AUTO
    await databaseConnection().getRepository('piece_metadata').createQueryBuilder().delete().execute()
    await databaseConnection().query('DELETE FROM "background_migrations" WHERE "name" = $1', [new RefetchMissingPieceTranslations1879000000000().name])
    for (const piece of [brokenOffered, brokenWithdrawn, brokenFetchFails, untranslatedUpstream, alreadyTranslated, customPiece]) {
        await pieceMetadataService(app!.log).create({ pieceMetadata: piece, packageType: PackageType.REGISTRY, pieceType: piece.pieceType, publishCacheRefresh: false })
    }
    getMock.mockImplementation(async (url: string) => stubRegistry(url))
})

afterEach(() => {
    process.env.AP_PIECES_SYNC_MODE = PieceSyncMode.NONE
    getMock.mockReset()
})

describe('RefetchMissingPieceTranslations', () => {
    it('restores every locale for a version synced without translations, whatever its registry created date', async () => {
        await runThroughRunner()

        expect(await translationsOf(brokenOffered.id)).toEqual(REGISTRY_I18N)
    })

    it('leaves a version the registry no longer offers in place, untranslated and not fetched', async () => {
        await runThroughRunner()

        expect(await rowExists(brokenWithdrawn.id)).toBe(true)
        expect(await translationsOf(brokenWithdrawn.id)).toEqual({})
        expect(fetchedVersions()).not.toContain(`${brokenWithdrawn.name}@${brokenWithdrawn.version}`)
    })

    it('skips a version whose fetch fails and still completes, so it cannot block later migrations', async () => {
        await runThroughRunner()

        expect(await translationsOf(brokenFetchFails.id)).toEqual({})
        expect(await translationsOf(brokenOffered.id)).toEqual(REGISTRY_I18N)
        expect(await markedComplete()).toBe(true)
    })

    it('does not fetch versions that already have translations, or custom pieces', async () => {
        await runThroughRunner()

        expect(fetchedVersions()).not.toContain(`${alreadyTranslated.name}@${alreadyTranslated.version}`)
        expect(fetchedVersions()).not.toContain(`${customPiece.name}@${customPiece.version}`)
        expect(await translationsOf(untranslatedUpstream.id)).toEqual({})
    })

    it('does nothing when piece sync is off', async () => {
        process.env.AP_PIECES_SYNC_MODE = PieceSyncMode.NONE

        await runThroughRunner()

        expect(getMock).not.toHaveBeenCalled()
        expect(await translationsOf(brokenOffered.id)).toEqual({})
        expect(await markedComplete()).toBe(true)
    })
})

function officialPiece({ name, version, created, i18n }: { name: string, version: string, created?: string, i18n?: typeof REGISTRY_I18N }): ReturnType<typeof createMockPieceMetadata> {
    return createMockPieceMetadata({ name, version, created, i18n, pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY, platformId: undefined })
}

function stubRegistry(url: string): { data: unknown } {
    if (url.includes('/registry?')) {
        return { data: [brokenOffered, brokenFetchFails, untranslatedUpstream, alreadyTranslated].map(({ name, version }) => ({ name, version })) }
    }
    if (url.includes(brokenFetchFails.name)) {
        throw new Error('connect ETIMEDOUT')
    }
    if (url.includes(untranslatedUpstream.name)) {
        return { data: { name: untranslatedUpstream.name, version: untranslatedUpstream.version } }
    }
    return { data: { name: brokenOffered.name, version: brokenOffered.version, i18n: REGISTRY_I18N } }
}

function fetchedVersions(): string[] {
    return getMock.mock.calls
        .map(([url]) => new URL(String(url)))
        .filter((url) => !url.pathname.endsWith('/registry'))
        .map((url) => `${decodeURIComponent(url.pathname.replace('/api/v1/pieces/', ''))}@${url.searchParams.get('version')}`)
}

async function runThroughRunner(): Promise<void> {
    await backgroundMigrationRunner.run({ log: app!.log, migrations: [RefetchMissingPieceTranslations1879000000000] })
}

async function translationsOf(pieceMetadataId: string): Promise<Record<string, unknown>> {
    const rows: { locale: string, translations: unknown }[] = await databaseConnection().query(
        'SELECT "locale", "translations" FROM "piece_translation" WHERE "pieceMetadataId" = $1',
        [pieceMetadataId],
    )
    return Object.fromEntries(rows.map((row) => [row.locale, row.translations]))
}

async function rowExists(id: string): Promise<boolean> {
    const rows = await databaseConnection().query('SELECT 1 FROM "piece_metadata" WHERE "id" = $1', [id])
    return rows.length > 0
}

async function markedComplete(): Promise<boolean> {
    const rows = await databaseConnection().query(
        'SELECT 1 FROM "background_migrations" WHERE "name" = $1 AND "executed_at" IS NOT NULL',
        [new RefetchMissingPieceTranslations1879000000000().name],
    )
    return rows.length > 0
}
