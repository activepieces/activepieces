import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddExternalIdToMCPSqlite1753786833156 implements MigrationInterface {
    name = 'AddExternalIdToMCPSqlite1753786833156'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "mcp_project_id"
        `)
        await queryRunner.query(`
            DROP INDEX "mcp_agent_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_mcp" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "token" varchar NOT NULL,
                "name" varchar NOT NULL,
                "agentId" varchar,
                "externalId" varchar(21) NOT NULL,
                CONSTRAINT "fk_mcp_agent_id" FOREIGN KEY ("agentId") REFERENCES "agent" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_mcp"(
                    "id",
                    "externalId",
                    "created",
                    "updated",
                    "projectId",
                    "token",
                    "name",
                    "agentId"
                )
            SELECT "id",
                "id",
                "created",
                "updated",
                "projectId",
                "token",
                "name",
                "agentId"
            FROM "mcp"
        `)
        await queryRunner.query(`
            DROP TABLE "mcp"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_mcp"
                RENAME TO "mcp"
        `)
        await queryRunner.query(`
            CREATE INDEX "mcp_agent_id" ON "mcp" ("agentId")
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
            DROP INDEX "mcp_agent_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp"
                RENAME TO "temporary_mcp"
        `)
        await queryRunner.query(`
            CREATE TABLE "mcp" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "token" varchar NOT NULL,
                "name" varchar NOT NULL,
                "agentId" varchar,
                CONSTRAINT "fk_mcp_agent_id" FOREIGN KEY ("agentId") REFERENCES "agent" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "mcp"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "token",
                    "name",
                    "agentId"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "token",
                "name",
                "agentId"
            FROM "temporary_mcp"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_mcp"
        `)
        await queryRunner.query(`
            CREATE INDEX "mcp_agent_id" ON "mcp" ("agentId")
        `)
        await queryRunner.query(`
            CREATE INDEX "mcp_project_id" ON "mcp" ("projectId")
        `)
    }

}
