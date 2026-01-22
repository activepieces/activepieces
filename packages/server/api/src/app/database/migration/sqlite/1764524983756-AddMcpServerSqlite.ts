import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddMcpServerSqlite1764524983756 implements MigrationInterface {
    name = 'AddMcpServerSqlite1764524983756'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "mcp_server" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "status" varchar NOT NULL,
                "token" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "mcp_server_project_id" ON "mcp_server" ("projectId")
        `)
        await queryRunner.query(`
            DROP INDEX "mcp_server_project_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_mcp_server" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "status" varchar NOT NULL,
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
                    "status",
                    "token"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "status",
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "mcp_server_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_server"
                RENAME TO "temporary_mcp_server"
        `)
        await queryRunner.query(`
            CREATE TABLE "mcp_server" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "status" varchar NOT NULL,
                "token" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "mcp_server"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "status",
                    "token"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "status",
                "token"
            FROM "temporary_mcp_server"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_mcp_server"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "mcp_server_project_id" ON "mcp_server" ("projectId")
        `)
        await queryRunner.query(`
            DROP INDEX "mcp_server_project_id"
        `)
        await queryRunner.query(`
            DROP TABLE "mcp_server"
        `)
    }

}
