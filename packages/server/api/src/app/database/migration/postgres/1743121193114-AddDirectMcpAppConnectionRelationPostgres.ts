import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDirectMcpAppConnectionRelationPostgres1743121193114 implements MigrationInterface {
    name = 'AddDirectMcpAppConnectionRelationPostgres1743121193114'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Add the mcpId column to app_connection table
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ADD "mcpId" character varying(21)
        `);

        // Step 2: Create an index for faster queries on mcpId
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_mcp_id" ON "app_connection" ("mcpId")
        `);

        // Step 3: Add foreign key constraint with CASCADE delete
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ADD CONSTRAINT "fk_app_connection_mcp_id" FOREIGN KEY ("mcpId") REFERENCES "mcp"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Step 4: Migrate existing connections from mcp_connection table to use the direct relationship
        // This copies connection IDs from the mcp_connection join table to the new mcpId column
        await queryRunner.query(`
            UPDATE "app_connection"
            SET "mcpId" = mc."mcpId"
            FROM "mcp_connection" mc
            WHERE mc."connectionId" = "app_connection"."id"
        `);

        // Step 5: Drop the join table constraints
        await queryRunner.query(`
            ALTER TABLE "mcp_connection" DROP CONSTRAINT IF EXISTS "fk_mcp_connection_app"
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp_connection" DROP CONSTRAINT IF EXISTS "fk_mcp_connection_mcp"
        `);

        // Step 6: Drop the join table indices
        await queryRunner.query(`
            DROP INDEX IF EXISTS "public"."idx_mcp_connection_mcp_id"
        `);
        await queryRunner.query(`
            DROP INDEX IF EXISTS "public"."idx_mcp_connection_connection_id"
        `);

        // Step 7: Drop the mcp_connection table since we're using direct relationship now
        await queryRunner.query(`
            DROP TABLE IF EXISTS "mcp_connection"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Recreate the mcp_connection table
        await queryRunner.query(`
            CREATE TABLE "mcp_connection" (
                "mcpId" character varying(21) NOT NULL,
                "connectionId" character varying(21) NOT NULL,
                CONSTRAINT "pk_mcp_connection" PRIMARY KEY ("mcpId", "connectionId")
            )
        `);

        // Step 2: Recreate the indices for the join table
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_connection_mcp_id" ON "mcp_connection" ("mcpId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_connection_connection_id" ON "mcp_connection" ("connectionId")
        `);

        // Step 3: Recreate the foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "mcp_connection" 
            ADD CONSTRAINT "fk_mcp_connection_mcp" FOREIGN KEY ("mcpId") REFERENCES "mcp"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp_connection" 
            ADD CONSTRAINT "fk_mcp_connection_app" FOREIGN KEY ("connectionId") REFERENCES "app_connection"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Step 4: Migrate data from direct relationship to join table
        await queryRunner.query(`
            INSERT INTO "mcp_connection" ("mcpId", "connectionId")
            SELECT "mcpId", "id" 
            FROM "app_connection"
            WHERE "mcpId" IS NOT NULL
        `);

        // Step 5: Drop the foreign key constraint for mcpId
        await queryRunner.query(`
            ALTER TABLE "app_connection" DROP CONSTRAINT "fk_app_connection_mcp_id"
        `);

        // Step 6: Drop the index for mcpId
        await queryRunner.query(`
            DROP INDEX "public"."idx_app_connection_mcp_id"
        `);

        // Step 7: Drop the mcpId column
        await queryRunner.query(`
            ALTER TABLE "app_connection" DROP COLUMN "mcpId"
        `);
    }
} 