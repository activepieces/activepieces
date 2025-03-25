import { MigrationInterface, QueryRunner } from 'typeorm'

export class TablesProductSqlite1734354249984 implements MigrationInterface {
    name = 'TablesProduct1734354249984'

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
                "type" varchar CHECK("type" IN ('NUMBER', 'TEXT', 'DATE', 'JSON')) NOT NULL,
                "tableId" varchar(21) NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_field_table_id_name" ON "field" ("tableId", "name")
        `)
        await queryRunner.query(`
            CREATE TABLE "record" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "tableId" varchar(21) NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE TABLE "cell" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "recordId" varchar(21) NOT NULL,
                "fieldId" varchar(21) NOT NULL,
                "value" varchar NOT NULL
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
            DROP INDEX "idx_field_table_id_name"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_field" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "type" varchar CHECK("type" IN ('NUMBER', 'TEXT', 'DATE', 'JSON')) NOT NULL,
                "tableId" varchar(21) NOT NULL,
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
                    "tableId"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "type",
                "tableId"
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
            CREATE INDEX "idx_field_table_id_name" ON "field" ("tableId", "name")
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_record" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "tableId" varchar(21) NOT NULL,
                CONSTRAINT "fk_record_table_id" FOREIGN KEY ("tableId") REFERENCES "table" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_record"("id", "created", "updated", "tableId")
            SELECT "id",
                "created",
                "updated",
                "tableId"
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
            CREATE TABLE "temporary_cell" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "recordId" varchar(21) NOT NULL,
                "fieldId" varchar(21) NOT NULL,
                "value" varchar NOT NULL,
                CONSTRAINT "fk_cell_record_id" FOREIGN KEY ("recordId") REFERENCES "record" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_cell_field_id" FOREIGN KEY ("fieldId") REFERENCES "field" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_cell"(
                    "id",
                    "created",
                    "updated",
                    "recordId",
                    "fieldId",
                    "value"
                )
            SELECT "id",
                "created",
                "updated",
                "recordId",
                "fieldId",
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
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
                    "value"
                )
            SELECT "id",
                "created",
                "updated",
                "recordId",
                "fieldId",
                "value"
            FROM "temporary_cell"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_cell"
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
                "tableId" varchar(21) NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "record"("id", "created", "updated", "tableId")
            SELECT "id",
                "created",
                "updated",
                "tableId"
            FROM "temporary_record"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_record"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_field_table_id_name"
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
                "tableId" varchar(21) NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "field"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "type",
                    "tableId"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "type",
                "tableId"
            FROM "temporary_field"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_field"
        `)
        await queryRunner.query(`
              CREATE INDEX "idx_field_table_id_name" ON "field" ("tableId", "name")
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
            DROP TABLE "cell"
        `)
        await queryRunner.query(`
            DROP TABLE "record"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_field_table_id_name"
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
