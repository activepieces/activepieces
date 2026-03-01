import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddIndexForSchemaVersionInFlowVersion1752151941009 implements MigrationInterface {
    name = 'AddIndexForSchemaVersionInFlowVersion1752151941009'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_flow_version_schema_version" ON "flow_version" ("schemaVersion")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_flow_version_schema_version"
        `)
    }

}
