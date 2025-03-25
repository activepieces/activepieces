import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddMCPWithConnectionsPostgres1742867572875 implements MigrationInterface {
    name = 'AddMCPWithConnectionsPostgres1742867572875'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('CREATE TYPE "public"."mcp_status_enum" AS ENUM (\'ENABLED\', \'DISABLED\')')

        await queryRunner.query(`
            CREATE TABLE "mcp" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" TIMESTAMP NOT NULL DEFAULT now(),
                "updated" TIMESTAMP NOT NULL DEFAULT now(),
                "projectId" varchar(21) NOT NULL,
                "status" "public"."mcp_status_enum" NOT NULL DEFAULT 'DISABLED',
                CONSTRAINT "mcp_project_id" UNIQUE ("projectId"),
                CONSTRAINT "fk_mcp_project" FOREIGN KEY ("projectId") 
                    REFERENCES "project" ("id") ON DELETE CASCADE
            )
        `)

        await queryRunner.query('CREATE INDEX "idx_mcp_project_id" ON "mcp" ("projectId")')

        await queryRunner.query(`
            CREATE TABLE "mcp_connection" (
                "mcpId" varchar(21) NOT NULL,
                "connectionId" varchar(21) NOT NULL,
                CONSTRAINT "pk_mcp_connection" PRIMARY KEY ("mcpId", "connectionId"),
                CONSTRAINT "fk_mcp_connection_mcp" FOREIGN KEY ("mcpId") 
                    REFERENCES "mcp" ("id") ON DELETE CASCADE,
                CONSTRAINT "fk_mcp_connection_app" FOREIGN KEY ("connectionId") 
                    REFERENCES "app_connection" ("id") ON DELETE CASCADE
            )
        `)

        await queryRunner.query('CREATE INDEX "idx_mcp_connection_mcp_id" ON "mcp_connection" ("mcpId")')
        await queryRunner.query('CREATE INDEX "idx_mcp_connection_connection_id" ON "mcp_connection" ("connectionId")')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX "idx_mcp_connection_connection_id"')
        await queryRunner.query('DROP INDEX "idx_mcp_connection_mcp_id"')
        await queryRunner.query('DROP TABLE "mcp_connection"')
        await queryRunner.query('DROP INDEX "idx_mcp_project_id"')
        await queryRunner.query('DROP TABLE "mcp"')
        await queryRunner.query('DROP TYPE "public"."mcp_status_enum"')
    }
} 