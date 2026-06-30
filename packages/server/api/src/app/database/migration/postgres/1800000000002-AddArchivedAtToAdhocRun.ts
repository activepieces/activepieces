import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddArchivedAtToAdhocRun1800000000002 implements Migration {
    name = 'AddArchivedAtToAdhocRun1800000000002'
    breaking = false
    release = '0.85.4'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "adhoc_run" ADD "archivedAt" character varying
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_adhoc_run_project_id_created_archived_at" ON "adhoc_run" ("projectId", "created", "archivedAt")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_adhoc_run_project_id_created_archived_at"
        `)
        await queryRunner.query(`
            ALTER TABLE "adhoc_run" DROP COLUMN "archivedAt"
        `)
    }
}
