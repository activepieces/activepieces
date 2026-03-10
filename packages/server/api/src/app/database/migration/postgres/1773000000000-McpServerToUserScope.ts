import { MigrationInterface, QueryRunner } from 'typeorm'

export class McpServerToUserScope1773000000000 implements MigrationInterface {
    name = 'McpServerToUserScope1773000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Truncate existing MCP servers — they are lazily upserted on first use
        await queryRunner.query('DELETE FROM "mcp_server"')

        // Drop the FK constraint referencing project
        await queryRunner.query(`
            ALTER TABLE "mcp_server" DROP CONSTRAINT "FK_dd85c7c51f3c8137aecb1cafd34"
        `)

        // Drop the unique index on projectId
        await queryRunner.query('DROP INDEX "mcp_server_project_id"')

        // Drop old columns
        await queryRunner.query('ALTER TABLE "mcp_server" DROP COLUMN "projectId"')
        await queryRunner.query('ALTER TABLE "mcp_server" DROP COLUMN "token"')

        // Add userId column
        await queryRunner.query(`
            ALTER TABLE "mcp_server" ADD COLUMN "userId" character varying(21) NOT NULL
        `)

        // Create unique index on userId
        await queryRunner.query(`
            CREATE UNIQUE INDEX "mcp_server_user_id" ON "mcp_server" ("userId")
        `)

        // Add FK constraint referencing user
        await queryRunner.query(`
            ALTER TABLE "mcp_server"
            ADD CONSTRAINT "fk_mcp_server_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)

        // Remove projectId from OAuth tables
        await queryRunner.query('ALTER TABLE "oauth_authorization_code" DROP COLUMN IF EXISTS "projectId"')
        await queryRunner.query('ALTER TABLE "oauth_refresh_token" DROP COLUMN IF EXISTS "projectId"')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Add back projectId to OAuth tables
        await queryRunner.query(`
            ALTER TABLE "oauth_refresh_token" ADD COLUMN "projectId" character varying(21)
        `)
        await queryRunner.query(`
            ALTER TABLE "oauth_authorization_code" ADD COLUMN "projectId" character varying(21)
        `)

        // Remove user FK constraint and index
        await queryRunner.query('ALTER TABLE "mcp_server" DROP CONSTRAINT "fk_mcp_server_user"')
        await queryRunner.query('DROP INDEX "mcp_server_user_id"')

        // Drop userId column
        await queryRunner.query('ALTER TABLE "mcp_server" DROP COLUMN "userId"')

        // Restore old columns (nullable since we have no data to restore)
        await queryRunner.query(`
            ALTER TABLE "mcp_server" ADD COLUMN "token" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_server" ADD COLUMN "projectId" character varying(21)
        `)

        // Restore unique index on projectId
        await queryRunner.query(`
            CREATE UNIQUE INDEX "mcp_server_project_id" ON "mcp_server" ("projectId")
        `)

        // Restore FK constraint referencing project
        await queryRunner.query(`
            ALTER TABLE "mcp_server"
            ADD CONSTRAINT "FK_dd85c7c51f3c8137aecb1cafd34" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    }
}
