import { AppSystemProp, DatabaseType } from '@activepieces/server-shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const databaseType = system.get(AppSystemProp.DB_TYPE)
const isPGlite = databaseType === DatabaseType.PGLITE

export class AddTodoRunIdIndex1772111378756 implements MigrationInterface {
    name = 'AddTodoRunIdIndex1772111378756'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isPGlite) {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_todo_run_id" ON "todo" ("runId")
            `)
        }
        else {
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_todo_run_id" ON "todo" ("runId")
            `)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isPGlite) {
            await queryRunner.query(`
                DROP INDEX IF EXISTS "idx_todo_run_id"
            `)
        }
        else {
            await queryRunner.query(`
                DROP INDEX CONCURRENTLY IF EXISTS "public"."idx_todo_run_id"
            `)
        }
    }

}
