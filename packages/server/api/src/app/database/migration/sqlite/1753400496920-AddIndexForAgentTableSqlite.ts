import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddIndexForAgentTableSqlite1753400496920 implements MigrationInterface {
    name = 'AddIndexForAgentTableSqlite1753400496920'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_flow_version_flow_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_table_project_id_name"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_table" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "externalId" varchar NOT NULL,
                "agentId" varchar,
                "trigger" varchar NOT NULL,
                "status" varchar,
                CONSTRAINT "UQ_64553403d0ac6bdb0876d4c72e2" UNIQUE ("agentId"),
                CONSTRAINT "fk_table_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_table_agent_id" FOREIGN KEY ("agentId") REFERENCES "agent" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_table"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "projectId",
                    "externalId",
                    "agentId",
                    "trigger",
                    "status"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "projectId",
                "externalId",
                "agentId",
                "trigger",
                "status"
            FROM "table"
        `)
        await queryRunner.query(`
            DROP TABLE "table"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_table"
                RENAME TO "table"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_table_project_id_name" ON "table" ("projectId", "name")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_table_project_id_name"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_table" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "externalId" varchar NOT NULL,
                "agentId" varchar,
                "trigger" varchar,
                "status" varchar,
                CONSTRAINT "UQ_64553403d0ac6bdb0876d4c72e2" UNIQUE ("agentId"),
                CONSTRAINT "fk_table_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_table_agent_id" FOREIGN KEY ("agentId") REFERENCES "agent" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_table"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "projectId",
                    "externalId",
                    "agentId",
                    "trigger",
                    "status"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "projectId",
                "externalId",
                "agentId",
                "trigger",
                "status"
            FROM "table"
        `)
        await queryRunner.query(`
            DROP TABLE "table"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_table"
                RENAME TO "table"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_table_project_id_name" ON "table" ("projectId", "name")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_version_flow_id_created_desc" ON "flow_version" ("flowId", "created")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_agent_run_project_agent_starttime" ON "agent_run" ("projectId", "agentId", "startTime")
        `)
        await queryRunner.query(`
            UPDATE "table"
            SET "trigger" = NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_agent_run_project_agent_starttime"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_version_flow_id_created_desc"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_table_project_id_name"
        `)
        await queryRunner.query(`
            ALTER TABLE "table"
                RENAME TO "temporary_table"
        `)
        await queryRunner.query(`
            CREATE TABLE "table" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "externalId" varchar NOT NULL,
                "agentId" varchar,
                "trigger" varchar NOT NULL,
                "status" varchar,
                CONSTRAINT "UQ_64553403d0ac6bdb0876d4c72e2" UNIQUE ("agentId"),
                CONSTRAINT "fk_table_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_table_agent_id" FOREIGN KEY ("agentId") REFERENCES "agent" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "table"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "projectId",
                    "externalId",
                    "agentId",
                    "trigger",
                    "status"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "projectId",
                "externalId",
                "agentId",
                "trigger",
                "status"
            FROM "temporary_table"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_table"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_table_project_id_name" ON "table" ("projectId", "name")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_table_project_id_name"
        `)
        await queryRunner.query(`
            ALTER TABLE "table"
                RENAME TO "temporary_table"
        `)
        await queryRunner.query(`
            CREATE TABLE "table" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "externalId" varchar NOT NULL,
                "agentId" varchar,
                "trigger" varchar NOT NULL,
                "status" varchar,
                CONSTRAINT "UQ_64553403d0ac6bdb0876d4c72e2" UNIQUE ("agentId"),
                CONSTRAINT "fk_table_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_table_agent_id" FOREIGN KEY ("agentId") REFERENCES "agent" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "table"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "projectId",
                    "externalId",
                    "agentId",
                    "trigger",
                    "status"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "projectId",
                "externalId",
                "agentId",
                "trigger",
                "status"
            FROM "temporary_table"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_table"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_table_project_id_name" ON "table" ("projectId", "name")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_version_flow_id" ON "flow_version" ("flowId")
        `)
    }

}
