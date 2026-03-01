import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddIndexForSchemaVersionInFlowVersionSqlite1752152069517 implements MigrationInterface {
    name = 'AddIndexForSchemaVersionInFlowVersionSqlite1752152069517'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX "idx_flow_version_schema_version" ON "flow_version" ("schemaVersion")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_flow_version_schema_version"
        `)
    }

}
