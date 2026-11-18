import { isNil, isObject, sanitizeObjectForPostgresql } from '@activepieces/core-utils'
import { QueryRunner } from 'typeorm'
import { BackgroundMigration } from '../../../background-migration'

export class BackfillPieceTranslation1874000000000 implements BackgroundMigration {
    name = 'BackfillPieceTranslation1874000000000'
    release = '0.93.0'
    transaction = false as const

    public async up(queryRunner: QueryRunner): Promise<void> {
        let lastId = ''
        while (true) {
            const [progress] = await queryRunner.query(`
                WITH batch AS (
                    SELECT "id", "i18n", "i18n"::text ~* $2 AS "hasUnicodeEscapes" FROM "piece_metadata"
                     WHERE "id" > $1
                     ORDER BY "id"
                     LIMIT $3
                ),
                inserted AS (
                    INSERT INTO "piece_translation" ("pieceMetadataId", "locale", "translations")
                    SELECT batch."id", entry.key, entry.value::jsonb
                      FROM batch, json_each(CASE WHEN NOT batch."hasUnicodeEscapes" AND json_typeof(batch."i18n") = 'object' THEN batch."i18n" END) AS entry
                     WHERE json_typeof(entry.value) = 'object'
                    ON CONFLICT DO NOTHING
                )
                SELECT max("id") AS "lastId",
                       array_remove(array_agg(CASE WHEN "hasUnicodeEscapes" THEN "id" END), NULL) AS "escapedIds"
                  FROM batch
            `, [lastId, UNICODE_ESCAPE_POSTGRES_CANNOT_DECODE, BATCH_SIZE]) as [{ lastId: string | null, escapedIds: string[] }]
            if (isNil(progress.lastId)) {
                return
            }
            await backfillPiecesWithUnicodeEscapes({ queryRunner, ids: progress.escapedIds })
            lastId = progress.lastId
        }
    }

    public async down(): Promise<void> {
        return
    }
}

async function backfillPiecesWithUnicodeEscapes({ queryRunner, ids }: BackfillPiecesWithUnicodeEscapesParams): Promise<void> {
    if (ids.length === 0) {
        return
    }
    const pieces = await queryRunner.query(
        'SELECT "id", "i18n"::text AS "i18n" FROM "piece_metadata" WHERE "id" = ANY($1)',
        [ids],
    ) as StoredPiece[]
    await queryRunner.query(`
        INSERT INTO "piece_translation" ("pieceMetadataId", "locale", "translations")
        SELECT row."pieceMetadataId", row."locale", row."translations"
          FROM jsonb_to_recordset($1::jsonb) AS row("pieceMetadataId" varchar, "locale" varchar, "translations" jsonb)
        ON CONFLICT DO NOTHING
    `, [JSON.stringify(pieces.flatMap(toTranslationRows))])
}

function toTranslationRows({ id, i18n }: StoredPiece): TranslationRow[] {
    const parsed: unknown = JSON.parse(i18n)
    const sanitized = sanitizeObjectForPostgresql(parsed)
    if (!isObject(sanitized)) {
        return []
    }
    return Object.entries(sanitized).flatMap(([locale, translations]) =>
        isObject(translations) ? [{ pieceMetadataId: id, locale, translations }] : [],
    )
}

const BATCH_SIZE = 200
const UNICODE_ESCAPE_POSTGRES_CANNOT_DECODE = String.raw`\\u(0000|d[89a-f])`

type BackfillPiecesWithUnicodeEscapesParams = {
    queryRunner: QueryRunner
    ids: string[]
}

type StoredPiece = {
    id: string
    i18n: string
}

type TranslationRow = {
    pieceMetadataId: string
    locale: string
    translations: Record<string, unknown>
}
