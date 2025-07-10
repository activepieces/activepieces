import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddIndexForSchemaVersionInFlowVersionSqlite1752106522814 implements MigrationInterface {
    name = 'AddIndexForSchemaVersionInFlowVersionSqlite1752106522814'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_flow_version_flow_id"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_version_flow_id_schema_version" ON "flow_version" ("flowId", "schemaVersion")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_flow_version_flow_id_schema_version"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_version_flow_id" ON "flow_version" ("flowId")
        `)
    }

}
