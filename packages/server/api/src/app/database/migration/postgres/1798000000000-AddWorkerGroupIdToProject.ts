import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddWorkerGroupIdToProject1798000000000 implements Migration {
    name = 'AddWorkerGroupIdToProject1798000000000'
    breaking = false
    release = '0.85.5'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD COLUMN IF NOT EXISTS "workerGroupId" character varying
        `)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_project_worker_group" ON "project" ("workerGroupId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_project_worker_group"')
        await queryRunner.query('ALTER TABLE "project" DROP COLUMN IF EXISTS "workerGroupId"')
    }
}
