import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

export class AddCellRecordIdIndex1830000000000 implements Migration {
    name = 'AddCellRecordIdIndex1830000000000'
    breaking = false
    release = '0.88.4'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isPGlite()) {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_cell_record_id"
                ON "cell" ("recordId")
            `)
        }
        else {
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_cell_record_id"
                ON "cell" ("recordId")
            `)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_cell_record_id"')
    }
}

const isPGlite = (): boolean => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE
