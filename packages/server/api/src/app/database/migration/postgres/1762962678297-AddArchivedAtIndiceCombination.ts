import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddArchivedAtIndiceCombination1762962678297 implements MigrationInterface {
    name = 'AddArchivedAtIndiceCombination1762962678297'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX "idx_run_project_env_created_not_archived" ON "flow_run" (
                "projectId",
                "environment",
                "created",
                "archivedAt"
            )
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."idx_run_project_env_created_not_archived"
        `)
    }

}
