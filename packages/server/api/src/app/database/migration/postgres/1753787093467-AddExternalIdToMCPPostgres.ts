import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddExternalIdToMCPPostgres1753787093467 implements MigrationInterface {
    name = 'AddExternalIdToMCPPostgres1753787093467'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "mcp_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp"
            ADD "externalId" character varying(21)
        `)
        await queryRunner.query(`
            UPDATE "mcp"
            SET "externalId" = "id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp"
            ALTER COLUMN "externalId" SET NOT NULL
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "mcp_project_id_external_id" ON "mcp" ("projectId", "externalId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "mcp_project_id_external_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp" DROP COLUMN "externalId"
        `)
        await queryRunner.query(`
            CREATE INDEX "mcp_project_id" ON "mcp" ("projectId")
        `)
    }

}
