import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

export class RelaxAppConnectionPieceFields1791000000001 implements Migration {
    name = 'RelaxAppConnectionPieceFields1791000000001'
    breaking = false
    release = '0.83.0'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        const concurrently = system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE ? '' : 'CONCURRENTLY'

        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ALTER COLUMN "pieceName" DROP NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ALTER COLUMN "pieceVersion" DROP NOT NULL
        `)
        await queryRunner.query(`
            CREATE INDEX ${concurrently} IF NOT EXISTS "idx_app_connection_piece_name"
            ON "app_connection" ("pieceName")
        `)
        await queryRunner.query(`
            UPDATE "app_connection"
            SET "externalId" = 'cred_' || "externalId"
            WHERE "pieceName" IS NULL
              AND LEFT("externalId", 5) <> 'cred_'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const concurrently = system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE ? '' : 'CONCURRENTLY'

        await queryRunner.query(`DROP INDEX ${concurrently} IF EXISTS "idx_app_connection_piece_name"`)

        const [{ count }] = await queryRunner.query(`
            SELECT COUNT(*)::int AS count
            FROM "app_connection"
            WHERE "pieceName" IS NULL OR "pieceVersion" IS NULL
        `)
        if (count > 0) {
            throw new Error(
                `Cannot rollback RelaxAppConnectionPieceFields: ${count} credential row(s) have a NULL pieceName/pieceVersion. ` +
                'Delete or migrate them manually before re-running the rollback so credential data is not silently lost.',
            )
        }
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ALTER COLUMN "pieceVersion" SET NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ALTER COLUMN "pieceName" SET NOT NULL
        `)
    }
}
