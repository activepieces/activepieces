import { MigrationInterface, QueryRunner } from 'typeorm'

export class MakeExternalIdNotNullableSqlite1746529105649 implements MigrationInterface {
    name = 'MakeExternalIdNotNullableSqlite1746529105649'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_flow_project_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_folder_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_flow" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "folderId" varchar(21),
                "status" varchar CHECK("status" IN ('ENABLED', 'DISABLED')) NOT NULL DEFAULT ('DISABLED'),
                "schedule" text,
                "publishedVersionId" varchar(21),
                "externalId" varchar,
                "metadata" text,
                CONSTRAINT "UQ_15375936ad7b8c5dc3f50783a22" UNIQUE ("publishedVersionId"),
                CONSTRAINT "fk_flow_published_version" FOREIGN KEY ("publishedVersionId") REFERENCES "flow_version" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
                CONSTRAINT "fk_flow_folder_id" FOREIGN KEY ("folderId") REFERENCES "folder" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION,
                    CONSTRAINT "fk_flow_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_flow"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "folderId",
                    "status",
                    "schedule",
                    "publishedVersionId",
                    "externalId",
                    "metadata"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "folderId",
                "status",
                "schedule",
                "publishedVersionId",
                "externalId",
                "metadata"
            FROM "flow"
        `)
        await queryRunner.query(`
            DROP TABLE "flow"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_flow"
                RENAME TO "flow"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_project_id" ON "flow" ("projectId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_folder_id" ON "flow" ("folderId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_project_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_folder_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_flow" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "folderId" varchar(21),
                "status" varchar CHECK("status" IN ('ENABLED', 'DISABLED')) NOT NULL DEFAULT ('DISABLED'),
                "schedule" text,
                "publishedVersionId" varchar(21),
                "externalId" varchar NOT NULL,
                "metadata" text,
                CONSTRAINT "UQ_15375936ad7b8c5dc3f50783a22" UNIQUE ("publishedVersionId"),
                CONSTRAINT "fk_flow_published_version" FOREIGN KEY ("publishedVersionId") REFERENCES "flow_version" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
                CONSTRAINT "fk_flow_folder_id" FOREIGN KEY ("folderId") REFERENCES "folder" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION,
                    CONSTRAINT "fk_flow_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_flow"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "folderId",
                    "status",
                    "schedule",
                    "publishedVersionId",
                    "externalId",
                    "metadata"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "folderId",
                "status",
                "schedule",
                "publishedVersionId",
                "id",
                "metadata"
            FROM "flow"
        `)
        await queryRunner.query(`
            DROP TABLE "flow"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_flow"
                RENAME TO "flow"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_project_id" ON "flow" ("projectId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_folder_id" ON "flow" ("folderId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_flow_folder_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow"
                RENAME TO "temporary_flow"
        `)
        await queryRunner.query(`
            CREATE TABLE "flow" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "folderId" varchar(21),
                "status" varchar CHECK("status" IN ('ENABLED', 'DISABLED')) NOT NULL DEFAULT ('DISABLED'),
                "schedule" text,
                "publishedVersionId" varchar(21),
                "externalId" varchar,
                "metadata" text,
                CONSTRAINT "UQ_15375936ad7b8c5dc3f50783a22" UNIQUE ("publishedVersionId"),
                CONSTRAINT "fk_flow_published_version" FOREIGN KEY ("publishedVersionId") REFERENCES "flow_version" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
                CONSTRAINT "fk_flow_folder_id" FOREIGN KEY ("folderId") REFERENCES "folder" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION,
                    CONSTRAINT "fk_flow_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "flow"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "folderId",
                    "status",
                    "schedule",
                    "publishedVersionId",
                    "externalId",
                    "metadata"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "folderId",
                "status",
                "schedule",
                "publishedVersionId",
                "externalId",
                "metadata"
            FROM "temporary_flow"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_flow"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_folder_id" ON "flow" ("folderId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_project_id" ON "flow" ("projectId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_folder_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow"
                RENAME TO "temporary_flow"
        `)
        await queryRunner.query(`
            CREATE TABLE "flow" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "folderId" varchar(21),
                "status" varchar CHECK("status" IN ('ENABLED', 'DISABLED')) NOT NULL DEFAULT ('DISABLED'),
                "schedule" text,
                "publishedVersionId" varchar(21),
                "externalId" varchar,
                "metadata" text,
                CONSTRAINT "UQ_15375936ad7b8c5dc3f50783a22" UNIQUE ("publishedVersionId"),
                CONSTRAINT "fk_flow_published_version" FOREIGN KEY ("publishedVersionId") REFERENCES "flow_version" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
                CONSTRAINT "fk_flow_folder_id" FOREIGN KEY ("folderId") REFERENCES "folder" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION,
                    CONSTRAINT "fk_flow_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "flow"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "folderId",
                    "status",
                    "schedule",
                    "publishedVersionId",
                    "externalId",
                    "metadata"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "folderId",
                "status",
                "schedule",
                "publishedVersionId",
                "externalId",
                "metadata"
            FROM "temporary_flow"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_flow"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_folder_id" ON "flow" ("folderId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_project_id" ON "flow" ("projectId")
        `)
    }

}
