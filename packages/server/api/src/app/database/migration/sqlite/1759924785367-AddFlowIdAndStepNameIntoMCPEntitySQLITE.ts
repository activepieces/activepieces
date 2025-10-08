import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFlowIdAndStepNameIntoMCPEntitySQLITE1759924785367 implements MigrationInterface {
    name = 'AddFlowIdAndStepNameIntoMCPEntitySQLITE1759924785367'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "mcp_project_id_external_id"
        `);
        await queryRunner.query(`
            DROP INDEX "mcp_agent_id"
        `);
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
                "flowId" varchar,
                "stepName" varchar,
                CONSTRAINT "fk_mcp_agent_id" FOREIGN KEY ("agentId") REFERENCES "agent" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_mcp"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "token",
                    "name",
                    "agentId",
                    "externalId"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "token",
                "name",
                "agentId",
                "externalId"
            FROM "mcp"
        `);
        await queryRunner.query(`
            DROP TABLE "mcp"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_mcp"
                RENAME TO "mcp"
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "mcp_project_id_external_id" ON "mcp" ("projectId", "externalId")
        `);
        await queryRunner.query(`
            CREATE INDEX "mcp_agent_id" ON "mcp" ("agentId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "mcp_flow_id_step_name" ON "mcp" ("flowId", "stepName")
        `);
        await queryRunner.query(`
            DROP INDEX "mcp_project_id_external_id"
        `);
        await queryRunner.query(`
            DROP INDEX "mcp_agent_id"
        `);
        await queryRunner.query(`
            DROP INDEX "mcp_flow_id_step_name"
        `);
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
                "flowId" varchar,
                "stepName" varchar,
                CONSTRAINT "fk_mcp_agent_id" FOREIGN KEY ("agentId") REFERENCES "agent" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_4995fc49e7c658cf883a56542bf" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_mcp"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "token",
                    "name",
                    "agentId",
                    "externalId",
                    "flowId",
                    "stepName"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "token",
                "name",
                "agentId",
                "externalId",
                "flowId",
                "stepName"
            FROM "mcp"
        `);
        await queryRunner.query(`
            DROP TABLE "mcp"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_mcp"
                RENAME TO "mcp"
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "mcp_project_id_external_id" ON "mcp" ("projectId", "externalId")
        `);
        await queryRunner.query(`
            CREATE INDEX "mcp_agent_id" ON "mcp" ("agentId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "mcp_flow_id_step_name" ON "mcp" ("flowId", "stepName")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "mcp_flow_id_step_name"
        `);
        await queryRunner.query(`
            DROP INDEX "mcp_agent_id"
        `);
        await queryRunner.query(`
            DROP INDEX "mcp_project_id_external_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp"
                RENAME TO "temporary_mcp"
        `);
        await queryRunner.query(`
            CREATE TABLE "mcp" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "token" varchar NOT NULL,
                "name" varchar NOT NULL,
                "agentId" varchar,
                "externalId" varchar(21) NOT NULL,
                "flowId" varchar,
                "stepName" varchar,
                CONSTRAINT "fk_mcp_agent_id" FOREIGN KEY ("agentId") REFERENCES "agent" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "mcp"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "token",
                    "name",
                    "agentId",
                    "externalId",
                    "flowId",
                    "stepName"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "token",
                "name",
                "agentId",
                "externalId",
                "flowId",
                "stepName"
            FROM "temporary_mcp"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_mcp"
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "mcp_flow_id_step_name" ON "mcp" ("flowId", "stepName")
        `);
        await queryRunner.query(`
            CREATE INDEX "mcp_agent_id" ON "mcp" ("agentId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "mcp_project_id_external_id" ON "mcp" ("projectId", "externalId")
        `);
        await queryRunner.query(`
            DROP INDEX "mcp_flow_id_step_name"
        `);
        await queryRunner.query(`
            DROP INDEX "mcp_agent_id"
        `);
        await queryRunner.query(`
            DROP INDEX "mcp_project_id_external_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp"
                RENAME TO "temporary_mcp"
        `);
        await queryRunner.query(`
            CREATE TABLE "mcp" (
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
        `);
        await queryRunner.query(`
            INSERT INTO "mcp"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "token",
                    "name",
                    "agentId",
                    "externalId"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "token",
                "name",
                "agentId",
                "externalId"
            FROM "temporary_mcp"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_mcp"
        `);
        await queryRunner.query(`
            CREATE INDEX "mcp_agent_id" ON "mcp" ("agentId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "mcp_project_id_external_id" ON "mcp" ("projectId", "externalId")
        `);
    }

}
