import { apId, LocalesEnum } from '@activepieces/core-utils'
import { PieceType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { DataSource, QueryRunner } from 'typeorm'
import { initializeDatabase } from '../../../../src/app/database'
import { backgroundMigrationRunner } from '../../../../src/app/database/background-migration-runner'
import { databaseConnection, resetDatabaseConnection } from '../../../../src/app/database/database-connection'
import { AddPieceTranslationTable1873000000000 } from '../../../../src/app/database/migration/postgres/1873000000000-AddPieceTranslationTable'
import { BackfillPieceTranslation1874000000000 } from '../../../../src/app/database/migration/postgres/background/1874000000000-BackfillPieceTranslation'
import { createMockPieceMetadata } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const translated = createMockPieceMetadata({
    name: 'backfill-translated',
    i18n: {
        [LocalesEnum.GERMAN]: { 'Send a message': 'Eine Nachricht senden' },
        [LocalesEnum.FRENCH]: { 'Send a message': 'Envoyer un message' },
    },
})
const customTranslated = createMockPieceMetadata({
    name: 'backfill-custom',
    platformId: apId(),
    pieceType: PieceType.CUSTOM,
    i18n: { [LocalesEnum.SPANISH]: { 'Send a message': 'Enviar un mensaje' } },
})
const emptyTranslations = createMockPieceMetadata({ name: 'backfill-empty', i18n: {} })
const noTranslations = createMockPieceMetadata({ name: 'backfill-none', i18n: undefined })
const brokenTranslations = createMockPieceMetadata({ name: 'backfill-broken', i18n: undefined })
const dirtyTranslations = createMockPieceMetadata({ name: 'backfill-dirty', i18n: undefined })
const seeded = [translated, customTranslated, emptyTranslations, noTranslations, brokenTranslations, dirtyTranslations]
const seededIds = seeded.map((piece) => piece.id)

let app: FastifyInstance | null = null
let ds: DataSource

async function withQueryRunner(fn: (queryRunner: QueryRunner) => Promise<void>): Promise<void> {
    const queryRunner = ds.createQueryRunner()
    await queryRunner.connect()
    await fn(queryRunner)
    await queryRunner.release()
}

async function runBackfillDirectly(): Promise<void> {
    await withQueryRunner((queryRunner) => new BackfillPieceTranslation1874000000000().up(queryRunner))
}

async function runBackfillThroughRunner(): Promise<void> {
    await backgroundMigrationRunner.run({ log: app!.log, migrations: [BackfillPieceTranslation1874000000000] })
}

async function backfillMarkedComplete(): Promise<boolean> {
    const rows = await ds.query(
        'SELECT 1 FROM "background_migrations" WHERE "name" = $1 AND "executed_at" IS NOT NULL',
        [new BackfillPieceTranslation1874000000000().name],
    )
    return rows.length > 0
}

async function resetBackfill(): Promise<void> {
    await ds.query('DELETE FROM "background_migrations" WHERE "name" = $1', [new BackfillPieceTranslation1874000000000().name])
    await ds.query('DELETE FROM "piece_translation" WHERE "pieceMetadataId" = ANY($1)', [seededIds])
}

async function completionRecords(): Promise<number> {
    const [{ count }] = await ds.query(
        'SELECT count(*)::int AS "count" FROM "background_migrations" WHERE "name" = $1 AND "executed_at" IS NOT NULL',
        [new BackfillPieceTranslation1874000000000().name],
    )
    return count
}

async function tableExists(): Promise<boolean> {
    const [{ exists }] = await ds.query('SELECT to_regclass($1) IS NOT NULL AS "exists"', ['piece_translation'])
    return exists
}

async function translationRows(): Promise<{ pieceMetadataId: string, locale: string, translations: Record<string, string> }[]> {
    return ds.query(
        'SELECT "pieceMetadataId", "locale", "translations" FROM "piece_translation" WHERE "pieceMetadataId" = ANY($1) ORDER BY "locale"',
        [seededIds],
    )
}

describe('piece translation migrations', () => {
    beforeAll(async () => {
        resetDatabaseConnection()
        await initializeDatabase({ runMigrations: true })
        app = await setupTestEnvironment({ fresh: true })
        ds = databaseConnection()
        await ds.getRepository('piece_metadata').save(seeded)
        await ds.query(String.raw`UPDATE "piece_metadata" SET "i18n" = '{"ja": {"Se\u0000nd": "送\u0000信 \ud800 😀", "Literal": "a \\u0000 b"}}' WHERE "id" = $1`, [dirtyTranslations.id])
        await ds.query('UPDATE "piece_metadata" SET "i18n" = $1 WHERE "id" = $2', ['"not an object"', brokenTranslations.id])
    })

    afterAll(async () => {
        await ds.query('DELETE FROM "piece_metadata" WHERE "id" = ANY($1)', [seededIds])
        await teardownTestEnvironment()
    })

    it('copies one row per locale for official and custom pieces, skips empty or malformed i18n, and is safe to rerun', async () => {
        await runBackfillDirectly()
        await runBackfillDirectly()

        expect(await translationRows()).toEqual([
            { pieceMetadataId: translated.id, locale: LocalesEnum.GERMAN, translations: { 'Send a message': 'Eine Nachricht senden' } },
            { pieceMetadataId: customTranslated.id, locale: LocalesEnum.SPANISH, translations: { 'Send a message': 'Enviar un mensaje' } },
            { pieceMetadataId: translated.id, locale: LocalesEnum.FRENCH, translations: { 'Send a message': 'Envoyer un message' } },
            { pieceMetadataId: dirtyTranslations.id, locale: LocalesEnum.JAPANESE, translations: { 'Send': '送信  😀', 'Literal': 'a \\u0000 b' } },
        ])
    })

    it('runs the backfill once when several servers start the runner at the same time', async () => {
        await resetBackfill()
        const backfillBody = vi.spyOn(BackfillPieceTranslation1874000000000.prototype, 'up')

        await Promise.all(Array.from({ length: 4 }, () => runBackfillThroughRunner()))

        expect(backfillBody).toHaveBeenCalledTimes(1)
        expect(await translationRows()).toHaveLength(4)
        expect(await completionRecords()).toBe(1)
        backfillBody.mockRestore()
    })

    it('stays correct when backfills overlap without the lock', async () => {
        await resetBackfill()

        await Promise.all(Array.from({ length: 3 }, () => runBackfillDirectly()))

        expect(await translationRows()).toHaveLength(4)
    })

    it('rolling the table back clears the backfill mark, so re-upgrading copies the rows again', async () => {
        const migration = new AddPieceTranslationTable1873000000000()
        await runBackfillThroughRunner()
        expect(await backfillMarkedComplete()).toBe(true)

        await withQueryRunner((queryRunner) => migration.down(queryRunner))
        expect(await tableExists()).toBe(false)
        expect(await backfillMarkedComplete()).toBe(false)

        await withQueryRunner((queryRunner) => migration.up(queryRunner))
        await runBackfillThroughRunner()
        expect(await translationRows()).toHaveLength(4)
        expect(await backfillMarkedComplete()).toBe(true)
    })
})
