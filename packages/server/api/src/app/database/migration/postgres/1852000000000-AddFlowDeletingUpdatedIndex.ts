import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

export class AddFlowDeletingUpdatedIndex1852000000000 implements Migration {
    name = 'AddFlowDeletingUpdatedIndex1852000000000'
    breaking = false
    release = '0.92.0'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        const concurrently = isPGlite() ? '' : 'CONCURRENTLY '
        await queryRunner.query(`
            CREATE INDEX ${concurrently}IF NOT EXISTS "idx_flow_deleting_updated"
            ON "flow" ("updated")
            WHERE "operationStatus" = 'DELETING'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_flow_deleting_updated"')
    }
}

const isPGlite = (): boolean => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE
