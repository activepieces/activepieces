import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddPlatformMcpServer1788000000000 implements Migration {
    name = 'AddPlatformMcpServer1788000000000'
    breaking = false
    release = '0.82.1'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mcp_server"
            ADD COLUMN "platformId" varchar(21),
            ADD COLUMN "type" varchar
        `)

        await queryRunner.query(`
            UPDATE "mcp_server"
            SET "type" = CASE
                WHEN "projectId" IS NOT NULL THEN 'PROJECT'
                ELSE 'PLATFORM'
            END
        `)

        await queryRunner.query(`
            ALTER TABLE "mcp_server"
            ALTER COLUMN "type" SET NOT NULL
        `)

        await queryRunner.query(`
            ALTER TABLE "mcp_server"
            ALTER COLUMN "projectId" DROP NOT NULL
        `)

        await queryRunner.query(`
            ALTER TABLE "mcp_server"
            ADD CONSTRAINT "fk_mcp_server_platform_id"
            FOREIGN KEY ("platformId") REFERENCES "platform"("id")
            ON DELETE CASCADE
        `)

        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_mcp_server_platform_id"
            ON "mcp_server" ("platformId")
            WHERE "platformId" IS NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_mcp_server_platform_id"
        `)

        await queryRunner.query(`
            ALTER TABLE "mcp_server"
            DROP CONSTRAINT IF EXISTS "fk_mcp_server_platform_id"
        `)

        // Remove platform MCP servers before making projectId NOT NULL
        await queryRunner.query(`
            DELETE FROM "mcp_server" WHERE "type" = 'PLATFORM'
        `)

        await queryRunner.query(`
            ALTER TABLE "mcp_server"
            ALTER COLUMN "projectId" SET NOT NULL
        `)

        await queryRunner.query(`
            ALTER TABLE "mcp_server"
            DROP COLUMN "type",
            DROP COLUMN "platformId"
        `)
    }
}
