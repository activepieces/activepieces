import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveProjectIdFromPieceMetadataSqlite1761904011591 implements MigrationInterface {
    name = 'RemoveProjectIdFromPieceMetadataSqlite1761904011591'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_piece_metadata_name_project_id_version"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_piece_metadata" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "displayName" varchar NOT NULL,
                "logoUrl" varchar NOT NULL,
                "description" varchar,
                "projectId" varchar,
                "version" varchar NOT NULL,
                "minimumSupportedRelease" varchar NOT NULL,
                "maximumSupportedRelease" varchar NOT NULL,
                "auth" text,
                "actions" text NOT NULL,
                "triggers" text NOT NULL,
                "pieceType" varchar NOT NULL,
                "packageType" varchar NOT NULL,
                "archiveId" varchar(21),
                "platformId" varchar,
                "categories" text,
                "authors" text NOT NULL,
                "projectUsage" integer NOT NULL DEFAULT (0),
                "i18n" text,
                CONSTRAINT "UQ_0f9b96e2f69449fb836dfeae559" UNIQUE ("archiveId")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_piece_metadata"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "displayName",
                    "logoUrl",
                    "description",
                    "projectId",
                    "version",
                    "minimumSupportedRelease",
                    "maximumSupportedRelease",
                    "auth",
                    "actions",
                    "triggers",
                    "pieceType",
                    "packageType",
                    "archiveId",
                    "platformId",
                    "categories",
                    "authors",
                    "projectUsage",
                    "i18n"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "displayName",
                "logoUrl",
                "description",
                "projectId",
                "version",
                "minimumSupportedRelease",
                "maximumSupportedRelease",
                "auth",
                "actions",
                "triggers",
                "pieceType",
                "packageType",
                "archiveId",
                "platformId",
                "categories",
                "authors",
                "projectUsage",
                "i18n"
            FROM "piece_metadata"
        `);
        await queryRunner.query(`
            DROP TABLE "piece_metadata"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_piece_metadata"
                RENAME TO "piece_metadata"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_piece_metadata" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "displayName" varchar NOT NULL,
                "logoUrl" varchar NOT NULL,
                "description" varchar,
                "projectId" varchar(21),
                "version" varchar NOT NULL,
                "minimumSupportedRelease" varchar NOT NULL,
                "maximumSupportedRelease" varchar NOT NULL,
                "auth" text,
                "actions" text NOT NULL,
                "triggers" text NOT NULL,
                "pieceType" varchar NOT NULL,
                "packageType" varchar NOT NULL,
                "archiveId" varchar(21),
                "platformId" varchar,
                "categories" text,
                "authors" text NOT NULL,
                "projectUsage" integer NOT NULL DEFAULT (0),
                "i18n" text,
                CONSTRAINT "UQ_0f9b96e2f69449fb836dfeae559" UNIQUE ("archiveId")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_piece_metadata"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "displayName",
                    "logoUrl",
                    "description",
                    "projectId",
                    "version",
                    "minimumSupportedRelease",
                    "maximumSupportedRelease",
                    "auth",
                    "actions",
                    "triggers",
                    "pieceType",
                    "packageType",
                    "archiveId",
                    "platformId",
                    "categories",
                    "authors",
                    "projectUsage",
                    "i18n"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "displayName",
                "logoUrl",
                "description",
                "projectId",
                "version",
                "minimumSupportedRelease",
                "maximumSupportedRelease",
                "auth",
                "actions",
                "triggers",
                "pieceType",
                "packageType",
                "archiveId",
                "platformId",
                "categories",
                "authors",
                "projectUsage",
                "i18n"
            FROM "piece_metadata"
        `);
        await queryRunner.query(`
            DROP TABLE "piece_metadata"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_piece_metadata"
                RENAME TO "piece_metadata"
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_piece_metadata_name_platform_id_version" ON "piece_metadata" ("name", "version", "platformId")
        `);
        await queryRunner.query(`
            DROP INDEX "idx_piece_metadata_name_platform_id_version"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_piece_metadata" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "displayName" varchar NOT NULL,
                "logoUrl" varchar NOT NULL,
                "description" varchar,
                "projectId" varchar(21),
                "version" varchar NOT NULL,
                "minimumSupportedRelease" varchar NOT NULL,
                "maximumSupportedRelease" varchar NOT NULL,
                "auth" text,
                "actions" text NOT NULL,
                "triggers" text NOT NULL,
                "pieceType" varchar NOT NULL,
                "packageType" varchar NOT NULL,
                "archiveId" varchar(21),
                "platformId" varchar,
                "categories" text,
                "authors" text NOT NULL,
                "projectUsage" integer NOT NULL DEFAULT (0),
                "i18n" text,
                CONSTRAINT "UQ_0f9b96e2f69449fb836dfeae559" UNIQUE ("archiveId"),
                CONSTRAINT "fk_piece_metadata_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_piece_metadata_file" FOREIGN KEY ("archiveId") REFERENCES "file" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_piece_metadata"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "displayName",
                    "logoUrl",
                    "description",
                    "projectId",
                    "version",
                    "minimumSupportedRelease",
                    "maximumSupportedRelease",
                    "auth",
                    "actions",
                    "triggers",
                    "pieceType",
                    "packageType",
                    "archiveId",
                    "platformId",
                    "categories",
                    "authors",
                    "projectUsage",
                    "i18n"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "displayName",
                "logoUrl",
                "description",
                "projectId",
                "version",
                "minimumSupportedRelease",
                "maximumSupportedRelease",
                "auth",
                "actions",
                "triggers",
                "pieceType",
                "packageType",
                "archiveId",
                "platformId",
                "categories",
                "authors",
                "projectUsage",
                "i18n"
            FROM "piece_metadata"
        `);
        await queryRunner.query(`
            DROP TABLE "piece_metadata"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_piece_metadata"
                RENAME TO "piece_metadata"
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_piece_metadata_name_platform_id_version" ON "piece_metadata" ("name", "version", "platformId")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_piece_metadata_name_platform_id_version"
        `);
        await queryRunner.query(`
            ALTER TABLE "piece_metadata"
                RENAME TO "temporary_piece_metadata"
        `);
        await queryRunner.query(`
            CREATE TABLE "piece_metadata" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "displayName" varchar NOT NULL,
                "logoUrl" varchar NOT NULL,
                "description" varchar,
                "projectId" varchar(21),
                "version" varchar NOT NULL,
                "minimumSupportedRelease" varchar NOT NULL,
                "maximumSupportedRelease" varchar NOT NULL,
                "auth" text,
                "actions" text NOT NULL,
                "triggers" text NOT NULL,
                "pieceType" varchar NOT NULL,
                "packageType" varchar NOT NULL,
                "archiveId" varchar(21),
                "platformId" varchar,
                "categories" text,
                "authors" text NOT NULL,
                "projectUsage" integer NOT NULL DEFAULT (0),
                "i18n" text,
                CONSTRAINT "UQ_0f9b96e2f69449fb836dfeae559" UNIQUE ("archiveId")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "piece_metadata"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "displayName",
                    "logoUrl",
                    "description",
                    "projectId",
                    "version",
                    "minimumSupportedRelease",
                    "maximumSupportedRelease",
                    "auth",
                    "actions",
                    "triggers",
                    "pieceType",
                    "packageType",
                    "archiveId",
                    "platformId",
                    "categories",
                    "authors",
                    "projectUsage",
                    "i18n"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "displayName",
                "logoUrl",
                "description",
                "projectId",
                "version",
                "minimumSupportedRelease",
                "maximumSupportedRelease",
                "auth",
                "actions",
                "triggers",
                "pieceType",
                "packageType",
                "archiveId",
                "platformId",
                "categories",
                "authors",
                "projectUsage",
                "i18n"
            FROM "temporary_piece_metadata"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_piece_metadata"
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_piece_metadata_name_platform_id_version" ON "piece_metadata" ("name", "version", "platformId")
        `);
        await queryRunner.query(`
            DROP INDEX "idx_piece_metadata_name_platform_id_version"
        `);
        await queryRunner.query(`
            ALTER TABLE "piece_metadata"
                RENAME TO "temporary_piece_metadata"
        `);
        await queryRunner.query(`
            CREATE TABLE "piece_metadata" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "displayName" varchar NOT NULL,
                "logoUrl" varchar NOT NULL,
                "description" varchar,
                "projectId" varchar,
                "version" varchar NOT NULL,
                "minimumSupportedRelease" varchar NOT NULL,
                "maximumSupportedRelease" varchar NOT NULL,
                "auth" text,
                "actions" text NOT NULL,
                "triggers" text NOT NULL,
                "pieceType" varchar NOT NULL,
                "packageType" varchar NOT NULL,
                "archiveId" varchar(21),
                "platformId" varchar,
                "categories" text,
                "authors" text NOT NULL,
                "projectUsage" integer NOT NULL DEFAULT (0),
                "i18n" text,
                CONSTRAINT "UQ_0f9b96e2f69449fb836dfeae559" UNIQUE ("archiveId")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "piece_metadata"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "displayName",
                    "logoUrl",
                    "description",
                    "projectId",
                    "version",
                    "minimumSupportedRelease",
                    "maximumSupportedRelease",
                    "auth",
                    "actions",
                    "triggers",
                    "pieceType",
                    "packageType",
                    "archiveId",
                    "platformId",
                    "categories",
                    "authors",
                    "projectUsage",
                    "i18n"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "displayName",
                "logoUrl",
                "description",
                "projectId",
                "version",
                "minimumSupportedRelease",
                "maximumSupportedRelease",
                "auth",
                "actions",
                "triggers",
                "pieceType",
                "packageType",
                "archiveId",
                "platformId",
                "categories",
                "authors",
                "projectUsage",
                "i18n"
            FROM "temporary_piece_metadata"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_piece_metadata"
        `);
        await queryRunner.query(`
            ALTER TABLE "piece_metadata"
                RENAME TO "temporary_piece_metadata"
        `);
        await queryRunner.query(`
            CREATE TABLE "piece_metadata" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "displayName" varchar NOT NULL,
                "logoUrl" varchar NOT NULL,
                "description" varchar,
                "projectId" varchar,
                "version" varchar NOT NULL,
                "minimumSupportedRelease" varchar NOT NULL,
                "maximumSupportedRelease" varchar NOT NULL,
                "auth" text,
                "actions" text NOT NULL,
                "triggers" text NOT NULL,
                "pieceType" varchar NOT NULL,
                "packageType" varchar NOT NULL,
                "archiveId" varchar(21),
                "platformId" varchar,
                "categories" text,
                "authors" text NOT NULL,
                "projectUsage" integer NOT NULL DEFAULT (0),
                "i18n" text,
                CONSTRAINT "UQ_0f9b96e2f69449fb836dfeae559" UNIQUE ("archiveId"),
                CONSTRAINT "fk_piece_metadata_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "piece_metadata"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "displayName",
                    "logoUrl",
                    "description",
                    "projectId",
                    "version",
                    "minimumSupportedRelease",
                    "maximumSupportedRelease",
                    "auth",
                    "actions",
                    "triggers",
                    "pieceType",
                    "packageType",
                    "archiveId",
                    "platformId",
                    "categories",
                    "authors",
                    "projectUsage",
                    "i18n"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "displayName",
                "logoUrl",
                "description",
                "projectId",
                "version",
                "minimumSupportedRelease",
                "maximumSupportedRelease",
                "auth",
                "actions",
                "triggers",
                "pieceType",
                "packageType",
                "archiveId",
                "platformId",
                "categories",
                "authors",
                "projectUsage",
                "i18n"
            FROM "temporary_piece_metadata"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_piece_metadata"
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_piece_metadata_name_project_id_version" ON "piece_metadata" ("name", "version", "projectId")
        `);
    }

}
