import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddRunFlowVersionIdForForeignKeySqlite1760346793809 implements MigrationInterface {
    name = 'AddRunFlowVersionIdForForeignKeySqlite1760346793809'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX "idx_run_flow_version_id" ON "flow_run" ("flowVersionId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_run_flow_version_id"
        `)
    }

}
