import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddExternalIdForTablesAndFieldsSQLITE1746367601605 implements MigrationInterface {
    name = 'AddExternalIdForTablesAndFieldsSQLITE1746367601605'

    public async up(queryRunner: QueryRunner): Promise<void> {
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
                CONSTRAINT "fk_table_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_table"("id", "created", "updated", "name", "projectId", "externalId")
            SELECT "id",
                "created",
                "updated",
                "name",
                "projectId",
                "id"
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
                "type" varchar CHECK(
                    "type" IN ('TEXT', 'NUMBER', 'DATE', 'STATIC_DROPDOWN')
                ) NOT NULL,
                "tableId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "data" text,
                "externalId" varchar NOT NULL,
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
                    "projectId",
                    "data"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "type",
                "tableId",
                "projectId",
                "data"
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
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
                "type" varchar CHECK(
                    "type" IN ('TEXT', 'NUMBER', 'DATE', 'STATIC_DROPDOWN')
                ) NOT NULL,
                "tableId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "data" text,
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
                    "projectId",
                    "data"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "type",
                "tableId",
                "projectId",
                "data"
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
                "projectId" varchar(21) NOT NULL,
                CONSTRAINT "fk_table_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
    }

}
