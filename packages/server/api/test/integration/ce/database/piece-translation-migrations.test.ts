import { LocalesEnum } from '@activepieces/core-utils'
import { DataSource, QueryRunner } from 'typeorm'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection, resetDatabaseConnection } from '../../../../src/app/database/database-connection'
import { AddPieceTranslationTable1871000000000 } from '../../../../src/app/database/migration/postgres/1871000000000-AddPieceTranslationTable'
import { BackfillPieceTranslation1872000000000 } from '../../../../src/app/database/migration/postgres/background/1872000000000-BackfillPieceTranslation'
import { createMockPieceMetadata } from '../../../helpers/mocks'

const translated = createMockPieceMetadata({
    name: 'backfill-translated',
    i18n: {
        [LocalesEnum.GERMAN]: { 'Send a message': 'Eine Nachricht senden' },
        [LocalesEnum.FRENCH]: { 'Send a message': 'Envoyer un message' },
    },
})
const emptyTranslations = createMockPieceMetadata({ name: 'backfill-empty', i18n: {} })
const noTranslations = createMockPieceMetadata({ name: 'backfill-none', i18n: undefined })
const brokenTranslations = createMockPieceMetadata({ name: 'backfill-broken', i18n: undefined })
const dirtyTranslations = createMockPieceMetadata({ name: 'backfill-dirty', i18n: undefined })
const seededIds = [translated.id, emptyTranslations.id, noTranslations.id, brokenTranslations.id, dirtyTranslations.id]

async function withQueryRunner(ds: DataSource, fn: (queryRunner: QueryRunner) => Promise<void>): Promise<void> {
    const queryRunner = ds.createQueryRunner()
    await queryRunner.connect()
    await fn(queryRunner)
    await queryRunner.release()
}

async function runBackfill(ds: DataSource): Promise<void> {
    await withQueryRunner(ds, (queryRunner) => new BackfillPieceTranslation1872000000000().up(queryRunner))
}

async function translationRows(ds: DataSource): Promise<{ pieceMetadataId: string, locale: string, translations: Record<string, string> }[]> {
    return ds.query(
        'SELECT "pieceMetadataId", "locale", "translations" FROM "piece_translation" WHERE "pieceMetadataId" = ANY($1) ORDER BY "locale"',
        [seededIds],
    )
}

describe('piece translation migrations', () => {
    let ds: DataSource

    beforeAll(async () => {
        resetDatabaseConnection()
        await initializeDatabase({ runMigrations: true })
        ds = databaseConnection()
        await ds.getRepository('piece_metadata').save([translated, emptyTranslations, noTranslations, brokenTranslations, dirtyTranslations])
        await ds.query(String.raw`UPDATE "piece_metadata" SET "i18n" = '{"ja": {"Se\u0000nd": "送\u0000信 \ud800 \ud83d\ude00", "Literal": "a \\u0000 b"}}' WHERE "id" = $1`, [dirtyTranslations.id])
        await ds.query('UPDATE "piece_metadata" SET "i18n" = \'"not an object"\' WHERE "id" = $1', [brokenTranslations.id])
    })

    afterAll(async () => {
        await ds.query('DELETE FROM "piece_metadata" WHERE "id" = ANY($1)', [seededIds])
        await ds.destroy()
    })

    it('copies one row per locale, skips empty or malformed i18n, and is safe to rerun', async () => {
        await runBackfill(ds)
        await runBackfill(ds)

        expect(await translationRows(ds)).toEqual([
            { pieceMetadataId: translated.id, locale: LocalesEnum.GERMAN, translations: { 'Send a message': 'Eine Nachricht senden' } },
            { pieceMetadataId: translated.id, locale: LocalesEnum.FRENCH, translations: { 'Send a message': 'Envoyer un message' } },
            { pieceMetadataId: dirtyTranslations.id, locale: LocalesEnum.JAPANESE, translations: { 'Send': '送信  😀', 'Literal': 'a \\u0000 b' } },
        ])
    })

    it('rolls the table back and re-applies it, and the backfill restores the rows', async () => {
        const migration = new AddPieceTranslationTable1871000000000()
        await withQueryRunner(ds, (queryRunner) => migration.down(queryRunner))
        const [{ exists }] = await ds.query('SELECT to_regclass(\'piece_translation\') IS NOT NULL AS "exists"')
        expect(exists).toBe(false)

        await withQueryRunner(ds, (queryRunner) => migration.up(queryRunner))
        await runBackfill(ds)

        expect(await translationRows(ds)).toHaveLength(3)
    })
})
