import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

export class AddCellCascadeIndices1817000000000 implements Migration {
    name = 'AddCellCascadeIndices1817000000000'
    breaking = false
    release = '0.86.4'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isPGlite()) {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_cell_record_id"
                ON "cell" ("recordId")
            `)
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_cell_field_id"
                ON "cell" ("fieldId")
            `)
        }
        else {
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_cell_record_id"
                ON "cell" ("recordId")
            `)
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_cell_field_id"
                ON "cell" ("fieldId")
            `)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_cell_field_id"')
        await queryRunner.query('DROP INDEX IF EXISTS "idx_cell_record_id"')
    }
}

const isPGlite = (): boolean => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE
