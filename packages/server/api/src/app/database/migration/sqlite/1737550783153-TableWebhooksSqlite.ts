import { MigrationInterface, QueryRunner } from 'typeorm'

export class TableWebhooksSqlite1737550783153 implements MigrationInterface {
    name = 'TableWebhooksSqlite1737550783153'

    public async up(queryRunner: QueryRunner): Promise<void> {
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
                "flowId" varchar(21) NOT NULL
            )
        `)
        await queryRunner.query(`
            DROP INDEX "idx_field_project_id_table_id_name"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_field" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "type" varchar CHECK("type" IN ('TEXT', 'NUMBER', 'DATE')) NOT NULL,
                "tableId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                CONSTRAINT "fk_field_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_field_table_id" FOREIGN KEY ("tableId") REFERENCES "table" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_field"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "type",
                    "tableId",
                    "projectId"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "type",
                "tableId",
                "projectId"
            FROM "field"
        `)
        await queryRunner.query(`
            DROP TABLE "field"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_field"
                RENAME TO "field"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_field_project_id_table_id_name" ON "field" ("projectId", "tableId", "name")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_record_project_id_table_id" ON "record" ("projectId", "tableId")
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_table_webhook" (
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
                CONSTRAINT "fk_table_webhook_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_table_webhook_table_id" FOREIGN KEY ("tableId") REFERENCES "table" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_table_webhook_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_table_webhook"(
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
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
                "flowId" varchar(21) NOT NULL
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
                "eventType",
                "flowId"
            FROM "temporary_table_webhook"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_table_webhook"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_record_project_id_table_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_field_project_id_table_id_name"
        `)
        await queryRunner.query(`
            ALTER TABLE "field"
                RENAME TO "temporary_field"
        `)
        await queryRunner.query(`
            CREATE TABLE "field" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "type" varchar CHECK("type" IN ('NUMBER', 'TEXT', 'DATE', 'JSON')) NOT NULL,
                "tableId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                CONSTRAINT "fk_field_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_field_table_id" FOREIGN KEY ("tableId") REFERENCES "table" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "field"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "type",
                    "tableId",
                    "projectId"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "type",
                "tableId",
                "projectId"
            FROM "temporary_field"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_field"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_field_project_id_table_id_name" ON "field" ("projectId", "tableId", "name")
        `)
        await queryRunner.query(`
            DROP TABLE "table_webhook"
        `)
    }

}
