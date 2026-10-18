import { isNil } from '@activepieces/core-utils'
import { QueryRunner } from 'typeorm'
import { BackgroundMigration } from '../../../background-migration'

export class BackfillPieceTranslation1872000000000 implements BackgroundMigration {
    name = 'BackfillPieceTranslation1872000000000'
    release = '0.93.0'
    transaction = false as const

    public async up(queryRunner: QueryRunner): Promise<void> {
        let lastId = ''
        while (true) {
            const rows = await queryRunner.query(`
                WITH batch AS (
                    SELECT "id", CASE WHEN "i18n"::text ~* $3 THEN regexp_replace("i18n"::text, $2, '', 'g')::json ELSE "i18n" END AS "i18n" FROM "piece_metadata"
                     WHERE "id" > $1
                     ORDER BY "id"
                     LIMIT ${BATCH_SIZE}
                ),
                inserted AS (
                    INSERT INTO "piece_translation" ("pieceMetadataId", "locale", "translations")
                    SELECT batch."id", entry.key, entry.value::jsonb
                      FROM batch, json_each(CASE WHEN json_typeof(batch."i18n") = 'object' THEN batch."i18n" END) AS entry
                     WHERE json_typeof(entry.value) = 'object'
                    ON CONFLICT DO NOTHING
                )
                SELECT max("id") AS "lastId" FROM batch
            `, [lastId, JSONB_INVALID_ESCAPES, MAYBE_JSONB_INVALID_ESCAPE]) as [{ lastId: string | null }]
            if (isNil(rows[0].lastId)) {
                return
            }
            lastId = rows[0].lastId
        }
    }

    public async down(): Promise<void> {
        return
    }
}

const BATCH_SIZE = 200
const MAYBE_JSONB_INVALID_ESCAPE = String.raw`\\u(0000|d[89a-f])`
const JSONB_INVALID_ESCAPES = String.raw`\\u0000|\\u[dD][89abAB][0-9a-fA-F]{2}(?!\\u[dD][c-fC-F][0-9a-fA-F]{2})|(?<!\\u[dD][89abAB][0-9a-fA-F]{2})\\u[dD][c-fC-F][0-9a-fA-F]{2}`
