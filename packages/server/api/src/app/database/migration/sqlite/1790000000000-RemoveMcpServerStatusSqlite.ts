import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveMcpServerStatusSqlite1790000000000 implements MigrationInterface {
    name = 'RemoveMcpServerStatusSqlite1790000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "mcp_server_project_id"
        `)
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_mcp_server_token"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_mcp_server" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "token" varchar NOT NULL,
                CONSTRAINT "FK_dd85c7c51f3c8137aecb1cafd34" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_mcp_server"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "token"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "token"
            FROM "mcp_server"
        `)
        await queryRunner.query(`
            DROP TABLE "mcp_server"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_mcp_server"
                RENAME TO "mcp_server"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "mcp_server_project_id" ON "mcp_server" ("projectId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_mcp_server_token" ON "mcp_server" ("token")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_mcp_server_token"
        `)
        await queryRunner.query(`
            DROP INDEX IF EXISTS "mcp_server_project_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_mcp_server" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "status" varchar NOT NULL DEFAULT 'ENABLED',
                "token" varchar NOT NULL,
                CONSTRAINT "FK_dd85c7c51f3c8137aecb1cafd34" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_mcp_server"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "token"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "token"
            FROM "mcp_server"
        `)
        await queryRunner.query(`
            DROP TABLE "mcp_server"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_mcp_server"
                RENAME TO "mcp_server"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "mcp_server_project_id" ON "mcp_server" ("projectId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_mcp_server_token" ON "mcp_server" ("token")
        `)
    }
}
