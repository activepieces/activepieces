import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFlowWebhookEntity1761482550711 implements MigrationInterface {
    name = 'AddFlowWebhookEntity1761482550711'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_flow_project_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_flow_folder_id"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_flow" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "folderId" varchar(21),
                "status" varchar CHECK("status" IN ('ENABLED', 'DISABLED')) NOT NULL DEFAULT ('DISABLED'),
                "publishedVersionId" varchar(21),
                "externalId" varchar NOT NULL,
                "metadata" text,
                CONSTRAINT "UQ_15375936ad7b8c5dc3f50783a22" UNIQUE ("publishedVersionId"),
                CONSTRAINT "fk_flow_published_version" FOREIGN KEY ("publishedVersionId") REFERENCES "flow_version" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
                CONSTRAINT "fk_flow_folder_id" FOREIGN KEY ("folderId") REFERENCES "folder" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_flow"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "folderId",
                    "status",
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
                "publishedVersionId",
                "externalId",
                "metadata"
            FROM "flow"
        `);
        await queryRunner.query(`
            DROP TABLE "flow"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_flow"
                RENAME TO "flow"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_flow_project_id" ON "flow" ("projectId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_flow_folder_id" ON "flow" ("folderId")
        `);
        await queryRunner.query(`
            CREATE TABLE "flow_webhook" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "targetFlowId" varchar(21) NOT NULL
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "flow-webhook-trigger-flow" (
                "flow_webhook_id" varchar(21) NOT NULL,
                "flow_id" varchar NOT NULL,
                PRIMARY KEY ("flow_webhook_id", "flow_id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_8ee430e57850f891bf63ef7faa" ON "flow-webhook-trigger-flow" ("flow_webhook_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_b13c4b33941b89da9ee704274d" ON "flow-webhook-trigger-flow" ("flow_id")
        `);
        await queryRunner.query(`
            DROP INDEX "idx_project_owner_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_project_platform_id_external_id"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_project" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "ownerId" varchar(21) NOT NULL,
                "displayName" varchar NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "externalId" varchar,
                "deleted" datetime,
                "releasesEnabled" boolean NOT NULL DEFAULT (0),
                "metadata" text,
                "notifyStatus" varchar NOT NULL,
                CONSTRAINT "fk_project_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
                CONSTRAINT "fk_project_owner_id" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_project"(
                    "id",
                    "created",
                    "updated",
                    "ownerId",
                    "displayName",
                    "platformId",
                    "externalId",
                    "deleted",
                    "releasesEnabled",
                    "metadata"
                )
            SELECT "id",
                "created",
                "updated",
                "ownerId",
                "displayName",
                "platformId",
                "externalId",
                "deleted",
                "releasesEnabled",
                "metadata"
            FROM "project"
        `);
        await queryRunner.query(`
            DROP TABLE "project"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_project"
                RENAME TO "project"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_project_owner_id" ON "project" ("ownerId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_platform_id_external_id" ON "project" ("platformId", "externalId")
            WHERE "deleted" IS NULL
        `);
        await queryRunner.query(`
            DROP INDEX "idx_flow_project_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_flow_folder_id"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_flow" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "folderId" varchar(21),
                "status" varchar CHECK("status" IN ('ENABLED', 'DISABLED')) NOT NULL DEFAULT ('DISABLED'),
                "publishedVersionId" varchar(21),
                "externalId" varchar NOT NULL,
                "metadata" text,
                CONSTRAINT "UQ_15375936ad7b8c5dc3f50783a22" UNIQUE ("publishedVersionId"),
                CONSTRAINT "fk_flow_published_version" FOREIGN KEY ("publishedVersionId") REFERENCES "flow_version" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
                CONSTRAINT "fk_flow_folder_id" FOREIGN KEY ("folderId") REFERENCES "folder" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION,
                    CONSTRAINT "fk_flow_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_flow"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "folderId",
                    "status",
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
                "publishedVersionId",
                "externalId",
                "metadata"
            FROM "flow"
        `);
        await queryRunner.query(`
            DROP TABLE "flow"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_flow"
                RENAME TO "flow"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_flow_project_id" ON "flow" ("projectId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_flow_folder_id" ON "flow" ("folderId")
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_flow_webhook" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "targetFlowId" varchar(21) NOT NULL,
                CONSTRAINT "fk_flow_webhook_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_flow_webhook_flow_id" FOREIGN KEY ("targetFlowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_flow_webhook"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "targetFlowId"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "targetFlowId"
            FROM "flow_webhook"
        `);
        await queryRunner.query(`
            DROP TABLE "flow_webhook"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_flow_webhook"
                RENAME TO "flow_webhook"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_8ee430e57850f891bf63ef7faa"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_b13c4b33941b89da9ee704274d"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_flow-webhook-trigger-flow" (
                "flow_webhook_id" varchar(21) NOT NULL,
                "flow_id" varchar NOT NULL,
                CONSTRAINT "FK_8ee430e57850f891bf63ef7faa7" FOREIGN KEY ("flow_webhook_id") REFERENCES "flow_webhook" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_b13c4b33941b89da9ee704274d6" FOREIGN KEY ("flow_id") REFERENCES "flow" ("externalId") ON DELETE CASCADE ON UPDATE CASCADE,
                PRIMARY KEY ("flow_webhook_id", "flow_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_flow-webhook-trigger-flow"("flow_webhook_id", "flow_id")
            SELECT "flow_webhook_id",
                "flow_id"
            FROM "flow-webhook-trigger-flow"
        `);
        await queryRunner.query(`
            DROP TABLE "flow-webhook-trigger-flow"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_flow-webhook-trigger-flow"
                RENAME TO "flow-webhook-trigger-flow"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_8ee430e57850f891bf63ef7faa" ON "flow-webhook-trigger-flow" ("flow_webhook_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_b13c4b33941b89da9ee704274d" ON "flow-webhook-trigger-flow" ("flow_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "IDX_b13c4b33941b89da9ee704274d"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_8ee430e57850f891bf63ef7faa"
        `);
        await queryRunner.query(`
            ALTER TABLE "flow-webhook-trigger-flow"
                RENAME TO "temporary_flow-webhook-trigger-flow"
        `);
        await queryRunner.query(`
            CREATE TABLE "flow-webhook-trigger-flow" (
                "flow_webhook_id" varchar(21) NOT NULL,
                "flow_id" varchar NOT NULL,
                PRIMARY KEY ("flow_webhook_id", "flow_id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "flow-webhook-trigger-flow"("flow_webhook_id", "flow_id")
            SELECT "flow_webhook_id",
                "flow_id"
            FROM "temporary_flow-webhook-trigger-flow"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_flow-webhook-trigger-flow"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_b13c4b33941b89da9ee704274d" ON "flow-webhook-trigger-flow" ("flow_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_8ee430e57850f891bf63ef7faa" ON "flow-webhook-trigger-flow" ("flow_webhook_id")
        `);
        await queryRunner.query(`
            ALTER TABLE "flow_webhook"
                RENAME TO "temporary_flow_webhook"
        `);
        await queryRunner.query(`
            CREATE TABLE "flow_webhook" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "targetFlowId" varchar(21) NOT NULL
            )
        `);
        await queryRunner.query(`
            INSERT INTO "flow_webhook"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "targetFlowId"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "targetFlowId"
            FROM "temporary_flow_webhook"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_flow_webhook"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_flow_folder_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_flow_project_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "flow"
                RENAME TO "temporary_flow"
        `);
        await queryRunner.query(`
            CREATE TABLE "flow" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "folderId" varchar(21),
                "status" varchar CHECK("status" IN ('ENABLED', 'DISABLED')) NOT NULL DEFAULT ('DISABLED'),
                "publishedVersionId" varchar(21),
                "externalId" varchar NOT NULL,
                "metadata" text,
                CONSTRAINT "UQ_15375936ad7b8c5dc3f50783a22" UNIQUE ("publishedVersionId"),
                CONSTRAINT "fk_flow_published_version" FOREIGN KEY ("publishedVersionId") REFERENCES "flow_version" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
                CONSTRAINT "fk_flow_folder_id" FOREIGN KEY ("folderId") REFERENCES "folder" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "flow"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "folderId",
                    "status",
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
                "publishedVersionId",
                "externalId",
                "metadata"
            FROM "temporary_flow"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_flow"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_flow_folder_id" ON "flow" ("folderId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_flow_project_id" ON "flow" ("projectId")
        `);
        await queryRunner.query(`
            DROP INDEX "idx_project_platform_id_external_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_project_owner_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "project"
                RENAME TO "temporary_project"
        `);
        await queryRunner.query(`
            CREATE TABLE "project" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "ownerId" varchar(21) NOT NULL,
                "displayName" varchar NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "externalId" varchar,
                "deleted" datetime,
                "releasesEnabled" boolean NOT NULL DEFAULT (0),
                "metadata" text,
                CONSTRAINT "fk_project_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
                CONSTRAINT "fk_project_owner_id" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "project"(
                    "id",
                    "created",
                    "updated",
                    "ownerId",
                    "displayName",
                    "platformId",
                    "externalId",
                    "deleted",
                    "releasesEnabled",
                    "metadata"
                )
            SELECT "id",
                "created",
                "updated",
                "ownerId",
                "displayName",
                "platformId",
                "externalId",
                "deleted",
                "releasesEnabled",
                "metadata"
            FROM "temporary_project"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_project"
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_platform_id_external_id" ON "project" ("platformId", "externalId")
            WHERE "deleted" IS NULL
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_project_owner_id" ON "project" ("ownerId")
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_b13c4b33941b89da9ee704274d"
        `);
        await queryRunner.query(`
            DROP INDEX "IDX_8ee430e57850f891bf63ef7faa"
        `);
        await queryRunner.query(`
            DROP TABLE "flow-webhook-trigger-flow"
        `);
        await queryRunner.query(`
            DROP TABLE "flow_webhook"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_flow_folder_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_flow_project_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "flow"
                RENAME TO "temporary_flow"
        `);
        await queryRunner.query(`
            CREATE TABLE "flow" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "folderId" varchar(21),
                "status" varchar CHECK("status" IN ('ENABLED', 'DISABLED')) NOT NULL DEFAULT ('DISABLED'),
                "publishedVersionId" varchar(21),
                "externalId" varchar NOT NULL,
                "metadata" text,
                CONSTRAINT "UQ_15375936ad7b8c5dc3f50783a22" UNIQUE ("publishedVersionId"),
                CONSTRAINT "fk_flow_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
                CONSTRAINT "fk_flow_published_version" FOREIGN KEY ("publishedVersionId") REFERENCES "flow_version" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
                CONSTRAINT "fk_flow_folder_id" FOREIGN KEY ("folderId") REFERENCES "folder" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "flow"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "folderId",
                    "status",
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
                "publishedVersionId",
                "externalId",
                "metadata"
            FROM "temporary_flow"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_flow"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_flow_folder_id" ON "flow" ("folderId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_flow_project_id" ON "flow" ("projectId")
        `);
    }

}
