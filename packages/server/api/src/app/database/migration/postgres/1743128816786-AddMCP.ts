import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddMCP1743128816786 implements MigrationInterface {
    name = 'AddMCP1743128816786'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "mcp" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "projectId" character varying(21) NOT NULL,
                "token" character varying(21) NOT NULL,
                CONSTRAINT "PK_8d67eeb70e7ea0332150517d1cb" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "mcp_project_id" ON "mcp" ("projectId")
        `)
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ADD "mcpId" character varying(21)
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_mcp_id" ON "app_connection" ("mcpId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_app_connection_mcp_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "app_connection" DROP COLUMN "mcpId"
        `)
        await queryRunner.query(`
            DROP INDEX "mcp_project_id"
        `)
        await queryRunner.query(`
            DROP TABLE "mcp"
        `)
    }

}
