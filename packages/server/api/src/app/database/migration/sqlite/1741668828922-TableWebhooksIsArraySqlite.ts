import { MigrationInterface, QueryRunner } from 'typeorm'

export class TableWebhooksIsArraySqlite1741668828922 implements MigrationInterface {
    name = 'TableWebhooksIsArraySqlite1741668828922'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_table_project_id_name"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_table_webhook" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "tableId" varchar(21) NOT NULL,
                "events" varchar CHECK(
                    "events" IN (
                        'RECORD_CREATED',
                        'RECORD_UPDATED',
                        'RECORD_DELETED'
                    )
                ) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                CONSTRAINT "fk_table_webhook_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_table_webhook_table_id" FOREIGN KEY ("tableId") REFERENCES "table" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_table_webhook_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
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
                "eventType",
                "flowId"
            FROM "table_webhook"
        `)
        await queryRunner.query(`
            DROP TABLE "table_webhook"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_table_webhook"
                RENAME TO "table_webhook"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_table_webhook" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "tableId" varchar(21) NOT NULL,
                "events" text NOT NULL,
                "flowId" varchar(21) NOT NULL,
                CONSTRAINT "fk_table_webhook_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_table_webhook_table_id" FOREIGN KEY ("tableId") REFERENCES "table" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_table_webhook_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
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
        `)
        await queryRunner.query(`
            DROP TABLE "table_webhook"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_table_webhook"
                RENAME TO "table_webhook"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_table_project_id_name" ON "table" ("projectId", "name")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_table_project_id_name"
        `)
        await queryRunner.query(`
            ALTER TABLE "table_webhook"
                RENAME TO "temporary_table_webhook"
        `)
        await queryRunner.query(`
            CREATE TABLE "table_webhook" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "tableId" varchar(21) NOT NULL,
                "events" varchar CHECK(
                    "events" IN (
                        'RECORD_CREATED',
                        'RECORD_UPDATED',
                        'RECORD_DELETED'
                    )
                ) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                CONSTRAINT "fk_table_webhook_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_table_webhook_table_id" FOREIGN KEY ("tableId") REFERENCES "table" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_table_webhook_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
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
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_table_webhook"
        `)
        await queryRunner.query(`
            ALTER TABLE "table_webhook"
                RENAME TO "temporary_table_webhook"
        `)
        await queryRunner.query(`
            CREATE TABLE "table_webhook" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "tableId" varchar(21) NOT NULL,
                "eventType" varchar CHECK(
                    "eventType" IN (
                        'RECORD_CREATED',
                        'RECORD_UPDATED',
                        'RECORD_DELETED'
                    )
                ) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                CONSTRAINT "fk_table_webhook_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_table_webhook_table_id" FOREIGN KEY ("tableId") REFERENCES "table" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_table_webhook_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "table_webhook"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "tableId",
                    "eventType",
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
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_table_webhook"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_table_project_id_name" ON "table" ("projectId", "name")
        `)
    }

}
