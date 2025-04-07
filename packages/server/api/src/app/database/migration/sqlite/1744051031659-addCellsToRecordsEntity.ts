import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCellsToRecordsEntity1744051031659 implements MigrationInterface {
    name = 'AddCellsToRecordsEntity1744051031659'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_record_project_id_table_id"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_record" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "tableId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "cells" text,
                CONSTRAINT "fk_record_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_record_table_id" FOREIGN KEY ("tableId") REFERENCES "table" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
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
        `);
        await queryRunner.query(`
            DROP TABLE "record"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_record"
                RENAME TO "record"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_record_project_id_table_id" ON "record" ("projectId", "tableId")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_record_project_id_table_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "record"
                RENAME TO "temporary_record"
        `);
        await queryRunner.query(`
            CREATE TABLE "record" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "tableId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                CONSTRAINT "fk_record_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_record_table_id" FOREIGN KEY ("tableId") REFERENCES "table" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
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
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_record"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_record_project_id_table_id" ON "record" ("projectId", "tableId")
        `);
    }

}
