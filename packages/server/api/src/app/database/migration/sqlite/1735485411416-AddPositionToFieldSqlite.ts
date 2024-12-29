import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPositionToFieldSqlite1735485411416 implements MigrationInterface {
    name = 'AddPositionToFieldSqlite1735485411416'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_field_project_id_table_id_name_unique"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_field" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "type" varchar CHECK("type" IN ('NUMBER', 'TEXT', 'DATE', 'JSON')) NOT NULL,
                "tableId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "position" integer NOT NULL,
                CONSTRAINT "UQ_95f7385c777ffe5bc95c4022c38" UNIQUE ("position"),
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
            CREATE UNIQUE INDEX "idx_field_project_id_table_id_name_unique" ON "field" ("projectId", "tableId", "name")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_field_project_id_table_id_name_unique"
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
            CREATE UNIQUE INDEX "idx_field_project_id_table_id_name_unique" ON "field" ("projectId", "tableId", "name")
        `)
    }

}
