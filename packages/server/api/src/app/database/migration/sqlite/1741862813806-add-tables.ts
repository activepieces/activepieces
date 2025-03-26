import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTables1741862813806 implements MigrationInterface {
    name = 'AddTables1741862813806'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "table" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "projectId" varchar(21) NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_table_project_id_name" ON "table" ("projectId", "name")
        `)
        await queryRunner.query(`
            CREATE TABLE "field" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "type" varchar CHECK("type" IN ('TEXT', 'NUMBER', 'DATE')) NOT NULL,
                "tableId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_field_project_id_table_id_name" ON "field" ("projectId", "tableId", "name")
        `)
        await queryRunner.query(`
            CREATE TABLE "record" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "tableId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_record_project_id_table_id" ON "record" ("projectId", "tableId")
        `)
        await queryRunner.query(`
            CREATE TABLE "cell" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "recordId" varchar(21) NOT NULL,
                "fieldId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "value" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_cell_project_id_field_id_record_id_unique" ON "cell" ("projectId", "fieldId", "recordId")
        `)
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
                CONSTRAINT "fk_table_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_table"("id", "created", "updated", "name", "projectId")
            SELECT "id",
                "created",
                "updated",
                "name",
                "projectId"
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
                CONSTRAINT "fk_field_table_id" FOREIGN KEY ("tableId") REFERENCES "table" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_field_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
            DROP INDEX "idx_record_project_id_table_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_record" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "tableId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                CONSTRAINT "fk_record_table_id" FOREIGN KEY ("tableId") REFERENCES "table" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_record_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_record"(
                    "id",
                    "created",
                    "updated",
                    "tableId",
                    "projectId"
                )
            SELECT "id",
                "created",
                "updated",
                "tableId",
                "projectId"
            FROM "record"
        `)
        await queryRunner.query(`
            DROP TABLE "record"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_record"
                RENAME TO "record"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_record_project_id_table_id" ON "record" ("projectId", "tableId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_cell_project_id_field_id_record_id_unique"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_cell" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "recordId" varchar(21) NOT NULL,
                "fieldId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "value" varchar NOT NULL,
                CONSTRAINT "fk_cell_record_id" FOREIGN KEY ("recordId") REFERENCES "record" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_cell_field_id" FOREIGN KEY ("fieldId") REFERENCES "field" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_cell_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_cell"(
                    "id",
                    "created",
                    "updated",
                    "recordId",
                    "fieldId",
                    "projectId",
                    "value"
                )
            SELECT "id",
                "created",
                "updated",
                "recordId",
                "fieldId",
                "projectId",
                "value"
            FROM "cell"
        `)
        await queryRunner.query(`
            DROP TABLE "cell"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_cell"
                RENAME TO "cell"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_cell_project_id_field_id_record_id_unique" ON "cell" ("projectId", "fieldId", "recordId")
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
                "events" text NOT NULL,
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
            DROP INDEX "idx_cell_project_id_field_id_record_id_unique"
        `)
        await queryRunner.query(`
            ALTER TABLE "cell"
                RENAME TO "temporary_cell"
        `)
        await queryRunner.query(`
            CREATE TABLE "cell" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "recordId" varchar(21) NOT NULL,
                "fieldId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "value" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "cell"(
                    "id",
                    "created",
                    "updated",
                    "recordId",
                    "fieldId",
                    "projectId",
                    "value"
                )
            SELECT "id",
                "created",
                "updated",
                "recordId",
                "fieldId",
                "projectId",
                "value"
            FROM "temporary_cell"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_cell"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_cell_project_id_field_id_record_id_unique" ON "cell" ("projectId", "fieldId", "recordId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_record_project_id_table_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "record"
                RENAME TO "temporary_record"
        `)
        await queryRunner.query(`
            CREATE TABLE "record" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "tableId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "record"(
                    "id",
                    "created",
                    "updated",
                    "tableId",
                    "projectId"
                )
            SELECT "id",
                "created",
                "updated",
                "tableId",
                "projectId"
            FROM "temporary_record"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_record"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_record_project_id_table_id" ON "record" ("projectId", "tableId")
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
                "type" varchar CHECK("type" IN ('TEXT', 'NUMBER', 'DATE')) NOT NULL,
                "tableId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL
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
                "projectId" varchar(21) NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "table"("id", "created", "updated", "name", "projectId")
            SELECT "id",
                "created",
                "updated",
                "name",
                "projectId"
            FROM "temporary_table"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_table"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_table_project_id_name" ON "table" ("projectId", "name")
        `)
        await queryRunner.query(`
            DROP TABLE "table_webhook"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_cell_project_id_field_id_record_id_unique"
        `)
        await queryRunner.query(`
            DROP TABLE "cell"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_record_project_id_table_id"
        `)
        await queryRunner.query(`
            DROP TABLE "record"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_field_project_id_table_id_name"
        `)
        await queryRunner.query(`
            DROP TABLE "field"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_table_project_id_name"
        `)
        await queryRunner.query(`
            DROP TABLE "table"
        `)
    }

}
