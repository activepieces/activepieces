import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

export class AddWorkerGroupIdToFlow1864000000000 implements Migration {
    name = 'AddWorkerGroupIdToFlow1864000000000'
    breaking = false
    release = '0.92.0'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow"
            ADD COLUMN IF NOT EXISTS "workerGroupId" character varying
        `)
        if (isPGlite()) {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_flow_worker_group" ON "flow" ("workerGroupId")
            `)
        }
        else {
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_flow_worker_group" ON "flow" ("workerGroupId")
            `)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_flow_worker_group"')
        await queryRunner.query('ALTER TABLE "flow" DROP COLUMN IF EXISTS "workerGroupId"')
    }
}

const isPGlite = (): boolean => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE
