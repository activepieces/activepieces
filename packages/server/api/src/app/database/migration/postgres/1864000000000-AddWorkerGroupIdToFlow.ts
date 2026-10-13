import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddWorkerGroupIdToFlow1864000000000 implements Migration {
    name = 'AddWorkerGroupIdToFlow1864000000000'
    breaking = false
    release = '0.92.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow"
            ADD COLUMN IF NOT EXISTS "workerGroupId" character varying
        `)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_flow_worker_group" ON "flow" ("workerGroupId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_flow_worker_group"')
        await queryRunner.query('ALTER TABLE "flow" DROP COLUMN IF EXISTS "workerGroupId"')
    }
}
