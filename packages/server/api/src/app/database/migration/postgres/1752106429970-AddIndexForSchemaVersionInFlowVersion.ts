import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddIndexForSchemaVersionInFlowVersion1752106429970 implements MigrationInterface {
    name = 'AddIndexForSchemaVersionInFlowVersion1752106429970'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."idx_flow_version_flow_id"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_version_flow_id_schema_version" ON "flow_version" ("flowId", "schemaVersion")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."idx_flow_version_flow_id_schema_version"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_version_flow_id" ON "flow_version" ("flowId")
        `)
    }

}
