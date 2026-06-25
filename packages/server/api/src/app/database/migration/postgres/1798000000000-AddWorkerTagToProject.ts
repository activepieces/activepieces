import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddWorkerTagToProject1798000000000 implements Migration {
    name = 'AddWorkerTagToProject1798000000000'
    breaking = false
    release = '0.85.5'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD COLUMN IF NOT EXISTS "workerTag" character varying
        `)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_project_worker_tag" ON "project" ("workerTag")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_project_worker_tag"')
        await queryRunner.query('ALTER TABLE "project" DROP COLUMN IF EXISTS "workerTag"')
    }
}
