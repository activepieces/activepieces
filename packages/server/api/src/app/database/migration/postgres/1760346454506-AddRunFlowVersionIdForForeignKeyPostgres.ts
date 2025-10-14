import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddRunFlowVersionIdForForeignKeyPostgres1760346454506 implements MigrationInterface {
    name = 'AddRunFlowVersionIdForForeignKeyPostgres1760346454506'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_run_flow_version_id" ON "flow_run" ("flowVersionId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_run_flow_version_id"
        `)
    }

}
