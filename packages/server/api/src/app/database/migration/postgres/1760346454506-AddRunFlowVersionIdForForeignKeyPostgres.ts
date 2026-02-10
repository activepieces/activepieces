import { AppSystemProp, DatabaseType } from '@activepieces/server-shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const databaseType = system.get(AppSystemProp.DB_TYPE)
const isPGlite = databaseType === DatabaseType.PGLITE

export class AddRunFlowVersionIdForForeignKeyPostgres1760346454506 implements MigrationInterface {
    name = 'AddRunFlowVersionIdForForeignKeyPostgres1760346454506'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        const concurrent = !isPGlite

        if (concurrent) {
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_run_flow_version_id" ON "flow_run" ("flowVersionId")
            `)
        }
        else {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_run_flow_version_id" ON "flow_run" ("flowVersionId")
            `)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_run_flow_version_id"
        `)
    }

}