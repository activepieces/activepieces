import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddIndexOnFlowVersionConnectionIdsSqlite1762100000000 implements MigrationInterface {
    name = 'AddIndexOnFlowVersionConnectionIdsSqlite1762100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX "idx_flow_version_connection_ids" ON "flow_version" ("connectionIds");
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_flow_version_connection_ids";
        `)
    }
}
