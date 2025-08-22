import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexToTableFieldsSQLite1755103698267 implements MigrationInterface {
    name = 'AddIndexToTableFieldsSQLite1755103698267'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "idx_field_project_id_table_id_name"`);

        await queryRunner.query(`
            CREATE TABLE "temporary_field" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "type" varchar CHECK("type" IN ('TEXT', 'NUMBER', 'DATE', 'STATIC_DROPDOWN')) NOT NULL,
                "tableId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "data" text,
                "externalId" varchar NOT NULL,
                "index" integer NOT NULL,
                CONSTRAINT "uq_field_table_index" UNIQUE ("tableId", "index"),
                CONSTRAINT "fk_field_table_id" FOREIGN KEY ("tableId") REFERENCES "table" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_field_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);

        await queryRunner.query(`
            INSERT INTO "temporary_field"(
                "id", "created", "updated", "name", "type",
                "tableId", "projectId", "data", "externalId"
            )
            SELECT "id", "created", "updated", "name", "type",
                   "tableId", "projectId", "data", "externalId"
            FROM "field"
        `);

        await queryRunner.query(`
            UPDATE "temporary_field"
            SET "index" = (
                SELECT COUNT(*)
                FROM "field" f2
                WHERE f2."tableId" = "temporary_field"."tableId"
                AND f2."created" < "temporary_field"."created"
            )
        `);

        await queryRunner.query(`DROP TABLE "field"`);
        await queryRunner.query(`ALTER TABLE "temporary_field" RENAME TO "field"`);
        await queryRunner.query(`CREATE INDEX "idx_field_project_id_table_id_name" ON "field" ("projectId", "tableId", "name")`);
    }


    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "idx_field_project_id_table_id_name"`);

        await queryRunner.query(`ALTER TABLE "field" RENAME TO "temporary_field"`);

        await queryRunner.query(`
            CREATE TABLE "field" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "type" varchar CHECK("type" IN ('TEXT', 'NUMBER', 'DATE', 'STATIC_DROPDOWN')) NOT NULL,
                "tableId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "data" text,
                "externalId" varchar NOT NULL,
                CONSTRAINT "fk_field_table_id" FOREIGN KEY ("tableId") REFERENCES "table" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_field_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);

        await queryRunner.query(`
            INSERT INTO "field"(
                "id", "created", "updated", "name", "type",
                "tableId", "projectId", "data", "externalId"
            )
            SELECT "id", "created", "updated", "name", "type",
                   "tableId", "projectId", "data", "externalId"
            FROM "temporary_field"
        `);

        await queryRunner.query(`DROP TABLE "temporary_field"`);
        await queryRunner.query(`CREATE INDEX "idx_field_project_id_table_id_name" ON "field" ("projectId", "tableId", "name")`);
    }

}
