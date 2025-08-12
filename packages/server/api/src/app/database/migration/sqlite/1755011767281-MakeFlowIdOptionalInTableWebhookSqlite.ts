import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeFlowIdOptionalInTableWebhookSqlite1755011767281 implements MigrationInterface {
    name = 'MakeFlowIdOptionalInTableWebhookSqlite1755011767281'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "temporary_table_webhook" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "tableId" varchar(21) NOT NULL,
                "events" text NOT NULL,
                "flowId" varchar(21) NOT NULL,
                CONSTRAINT "fk_table_webhook_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_table_webhook_table_id" FOREIGN KEY ("tableId") REFERENCES "table" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_table_webhook_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_table_webhook"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "tableId",
                    "events",
                    "flowId"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "tableId",
                "events",
                "flowId"
            FROM "table_webhook"
        `);
        await queryRunner.query(`
            DROP TABLE "table_webhook"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_table_webhook"
                RENAME TO "table_webhook"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_table_webhook" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "tableId" varchar(21) NOT NULL,
                "events" text NOT NULL,
                "flowId" varchar(21) NOT NULL
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_table_webhook"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "tableId",
                    "events",
                    "flowId"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "tableId",
                "events",
                "flowId"
            FROM "table_webhook"
        `);
        await queryRunner.query(`
            DROP TABLE "table_webhook"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_table_webhook"
                RENAME TO "table_webhook"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_table_webhook" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "tableId" varchar(21) NOT NULL,
                "events" text NOT NULL,
                "flowId" varchar(21)
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_table_webhook"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "tableId",
                    "events",
                    "flowId"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "tableId",
                "events",
                "flowId"
            FROM "table_webhook"
        `);
        await queryRunner.query(`
            DROP TABLE "table_webhook"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_table_webhook"
                RENAME TO "table_webhook"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_table_webhook" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "tableId" varchar(21) NOT NULL,
                "events" text NOT NULL,
                "flowId" varchar(21),
                CONSTRAINT "fk_table_webhook_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_table_webhook_table_id" FOREIGN KEY ("tableId") REFERENCES "table" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_table_webhook_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_table_webhook"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "tableId",
                    "events",
                    "flowId"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "tableId",
                "events",
                "flowId"
            FROM "table_webhook"
        `);
        await queryRunner.query(`
            DROP TABLE "table_webhook"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_table_webhook"
                RENAME TO "table_webhook"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "table_webhook"
                RENAME TO "temporary_table_webhook"
        `);
        await queryRunner.query(`
            CREATE TABLE "table_webhook" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "tableId" varchar(21) NOT NULL,
                "events" text NOT NULL,
                "flowId" varchar(21)
            )
        `);
        await queryRunner.query(`
            INSERT INTO "table_webhook"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "tableId",
                    "events",
                    "flowId"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "tableId",
                "events",
                "flowId"
            FROM "temporary_table_webhook"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_table_webhook"
        `);
        await queryRunner.query(`
            ALTER TABLE "table_webhook"
                RENAME TO "temporary_table_webhook"
        `);
        await queryRunner.query(`
            CREATE TABLE "table_webhook" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "tableId" varchar(21) NOT NULL,
                "events" text NOT NULL,
                "flowId" varchar(21) NOT NULL
            )
        `);
        await queryRunner.query(`
            INSERT INTO "table_webhook"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "tableId",
                    "events",
                    "flowId"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "tableId",
                "events",
                "flowId"
            FROM "temporary_table_webhook"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_table_webhook"
        `);
        await queryRunner.query(`
            ALTER TABLE "table_webhook"
                RENAME TO "temporary_table_webhook"
        `);
        await queryRunner.query(`
            CREATE TABLE "table_webhook" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "tableId" varchar(21) NOT NULL,
                "events" text NOT NULL,
                "flowId" varchar(21) NOT NULL,
                CONSTRAINT "fk_table_webhook_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "table_webhook"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "tableId",
                    "events",
                    "flowId"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "tableId",
                "events",
                "flowId"
            FROM "temporary_table_webhook"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_table_webhook"
        `);
        await queryRunner.query(`
            ALTER TABLE "table_webhook"
                RENAME TO "temporary_table_webhook"
        `);
        await queryRunner.query(`
            CREATE TABLE "table_webhook" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "tableId" varchar(21) NOT NULL,
                "events" text NOT NULL,
                "flowId" varchar(21) NOT NULL,
                CONSTRAINT "fk_table_webhook_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_table_webhook_table_id" FOREIGN KEY ("tableId") REFERENCES "table" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_table_webhook_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "table_webhook"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "tableId",
                    "events",
                    "flowId"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "tableId",
                "events",
                "flowId"
            FROM "temporary_table_webhook"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_table_webhook"
        `);
    }

}
