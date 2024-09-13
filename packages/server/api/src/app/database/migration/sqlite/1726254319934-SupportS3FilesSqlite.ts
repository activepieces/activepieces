import { MigrationInterface, QueryRunner } from "typeorm";

export class SupportS3FilesSqlite1726254319934 implements MigrationInterface {
    name = 'SupportS3FilesSqlite1726254319934'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_file_type_created_desc"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_file_project_id"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_file" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21),
                "data" blob,
                "type" varchar NOT NULL DEFAULT ('UNKNOWN'),
                "compression" varchar NOT NULL DEFAULT ('NONE'),
                "platformId" varchar(21),
                "location" varchar NOT NULL,
                "s3Key" varchar,
                CONSTRAINT "fk_file_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_file"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "data",
                    "type",
                    "compression",
                    "platformId",
                    "location"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "data",
                "type",
                "compression",
                "platformId",
                "DB"
            FROM "file"
        `);
        await queryRunner.query(`
            DROP TABLE "file"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_file"
                RENAME TO "file"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_file_type_created_desc" ON "file" ("type", "created")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_file_project_id" ON "file" ("projectId")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_file_project_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_file_type_created_desc"
        `);
        await queryRunner.query(`
            ALTER TABLE "file"
                RENAME TO "temporary_file"
        `);
        await queryRunner.query(`
            CREATE TABLE "file" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21),
                "data" blob NOT NULL,
                "type" varchar NOT NULL DEFAULT ('UNKNOWN'),
                "compression" varchar NOT NULL DEFAULT ('NONE'),
                "platformId" varchar(21),
                CONSTRAINT "fk_file_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "file"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "data",
                    "type",
                    "compression",
                    "platformId"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "data",
                "type",
                "compression",
                "platformId"
            FROM "temporary_file"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_file"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_file_project_id" ON "file" ("projectId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_file_type_created_desc" ON "file" ("type", "created")
        `);
    }

}
