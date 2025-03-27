import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveMcpStatusAddMcpTokenPostgres1743041373691 implements MigrationInterface {
    name = 'RemoveMcpStatusAddMcpTokenPostgres1743041373691'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys with IF EXISTS
        await queryRunner.query(`ALTER TABLE "mcp" DROP CONSTRAINT IF EXISTS "fk_mcp_project"`)
        await queryRunner.query(`ALTER TABLE "mcp_connection" DROP CONSTRAINT IF EXISTS "fk_mcp_connection_app"`)
        await queryRunner.query(`ALTER TABLE "mcp_connection" DROP CONSTRAINT IF EXISTS "fk_mcp_connection_mcp"`)
        
        // Drop indices
        await queryRunner.query(`DROP INDEX "idx_mcp_project_id"`)
        await queryRunner.query(`DROP INDEX "idx_mcp_connection_mcp_id"`)
        await queryRunner.query(`DROP INDEX "idx_mcp_connection_connection_id"`)
        
        // Remove status and add token
        await queryRunner.query(`ALTER TABLE "mcp" DROP COLUMN "status"`)
        await queryRunner.query(`DROP TYPE "public"."mcp_status_enum"`)
        await queryRunner.query(`ALTER TABLE "mcp" ADD "token" varchar(21) NOT NULL DEFAULT ''`)
        
        // Update timestamp columns to use timezone while preserving data
        await queryRunner.query(`ALTER TABLE "mcp" ALTER COLUMN "created" TYPE TIMESTAMP WITH TIME ZONE USING "created" AT TIME ZONE 'UTC'`)
        await queryRunner.query(`ALTER TABLE "mcp" ALTER COLUMN "updated" TYPE TIMESTAMP WITH TIME ZONE USING "updated" AT TIME ZONE 'UTC'`)
        
        // Recreate unique constraint - drop then recreate as index
        await queryRunner.query(`ALTER TABLE "mcp" DROP CONSTRAINT "mcp_project_id"`)
        await queryRunner.query(`CREATE UNIQUE INDEX "mcp_project_id" ON "mcp" ("projectId")`)
        
        // Recreate indices
        await queryRunner.query(`CREATE INDEX "idx_mcp_connection_mcp_id" ON "mcp_connection" ("mcpId")`)
        await queryRunner.query(`CREATE INDEX "idx_mcp_connection_connection_id" ON "mcp_connection" ("connectionId")`)
        
        // Recreate foreign keys
        await queryRunner.query(`ALTER TABLE "mcp_connection" ADD CONSTRAINT "fk_mcp_connection_mcp" FOREIGN KEY ("mcpId") REFERENCES "mcp"("id") ON DELETE CASCADE`)
        await queryRunner.query(`ALTER TABLE "mcp_connection" ADD CONSTRAINT "fk_mcp_connection_app" FOREIGN KEY ("connectionId") REFERENCES "app_connection"("id") ON DELETE CASCADE`)
        await queryRunner.query(`ALTER TABLE "mcp" ADD CONSTRAINT "fk_mcp_project" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys
        await queryRunner.query(`ALTER TABLE "mcp" DROP CONSTRAINT "fk_mcp_project"`)
        await queryRunner.query(`ALTER TABLE "mcp_connection" DROP CONSTRAINT "fk_mcp_connection_app"`)
        await queryRunner.query(`ALTER TABLE "mcp_connection" DROP CONSTRAINT "fk_mcp_connection_mcp"`)
        
        // Drop indices
        await queryRunner.query(`DROP INDEX "public"."idx_mcp_connection_connection_id"`)
        await queryRunner.query(`DROP INDEX "public"."idx_mcp_connection_mcp_id"`)
        await queryRunner.query(`DROP INDEX "public"."mcp_project_id"`)
        
        // Recreate unique constraint
        await queryRunner.query(`ALTER TABLE "mcp" ADD CONSTRAINT "mcp_project_id" UNIQUE ("projectId")`)
        
        // Revert timestamp columns while preserving data
        await queryRunner.query(`ALTER TABLE "mcp" ALTER COLUMN "updated" TYPE TIMESTAMP WITHOUT TIME ZONE USING "updated" AT TIME ZONE 'UTC'`)
        await queryRunner.query(`ALTER TABLE "mcp" ALTER COLUMN "created" TYPE TIMESTAMP WITHOUT TIME ZONE USING "created" AT TIME ZONE 'UTC'`)
        
        // Revert token and status columns
        await queryRunner.query(`ALTER TABLE "mcp" DROP COLUMN "token"`)
        await queryRunner.query(`CREATE TYPE "public"."mcp_status_enum" AS ENUM('ENABLED', 'DISABLED')`)
        await queryRunner.query(`ALTER TABLE "mcp" ADD "status" "public"."mcp_status_enum" NOT NULL DEFAULT 'DISABLED'`)
        
        // Recreate original indices
        await queryRunner.query(`CREATE INDEX "idx_mcp_connection_connection_id" ON "mcp_connection" ("connectionId")`)
        await queryRunner.query(`CREATE INDEX "idx_mcp_connection_mcp_id" ON "mcp_connection" ("mcpId")`)
        await queryRunner.query(`CREATE INDEX "idx_mcp_project_id" ON "mcp" ("projectId")`)
        
        // Recreate original foreign keys
        await queryRunner.query(`ALTER TABLE "mcp_connection" ADD CONSTRAINT "fk_mcp_connection_mcp" FOREIGN KEY ("mcpId") REFERENCES "mcp"("id") ON DELETE CASCADE ON UPDATE NO ACTION`)
        await queryRunner.query(`ALTER TABLE "mcp_connection" ADD CONSTRAINT "fk_mcp_connection_app" FOREIGN KEY ("connectionId") REFERENCES "app_connection"("id") ON DELETE CASCADE ON UPDATE NO ACTION`)
        await queryRunner.query(`ALTER TABLE "mcp" ADD CONSTRAINT "fk_mcp_project" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`)
    }
} 