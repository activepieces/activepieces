import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

export class AddConnectionIdsGinIndexToFlowVersion1805000000000 implements Migration {
    name = 'AddConnectionIdsGinIndexToFlowVersion1805000000000'
    breaking = false
    release = '0.86.1'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isPGlite()) {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_flow_version_connection_ids_gin"
                ON "flow_version" USING gin ("connectionIds")
            `)
        }
        else {
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_flow_version_connection_ids_gin"
                ON "flow_version" USING gin ("connectionIds")
            `)
        }
    }

    // No CONCURRENTLY here: TypeORM's revert path always wraps down() in a
    // transaction (the per-migration transaction flag only applies to up()),
    // and concurrent index drops are illegal inside a transaction.
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_flow_version_connection_ids_gin"')
    }
}

const isPGlite = (): boolean => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE
