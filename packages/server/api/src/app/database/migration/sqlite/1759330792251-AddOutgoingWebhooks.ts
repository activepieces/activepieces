import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOutgoingWebhooks1759330792251 implements MigrationInterface {
    name = 'AddOutgoingWebhooks1759330792251'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "outgoing_webhook" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar(21) NOT NULL,
                "projectId" varchar(21),
                "scope" varchar NOT NULL,
                "events" text NOT NULL,
                "url" varchar NOT NULL
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_outgoing_webhook_platform_scope" ON "outgoing_webhook" ("platformId")
            WHERE scope = 'PLATFORM'
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_outgoing_webhook_project_scope" ON "outgoing_webhook" ("projectId")
            WHERE scope = 'PROJECT'
        `);
        await queryRunner.query(`
            DROP INDEX "idx_outgoing_webhook_platform_scope"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_outgoing_webhook_project_scope"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_outgoing_webhook" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar(21) NOT NULL,
                "projectId" varchar(21),
                "scope" varchar NOT NULL,
                "events" text NOT NULL,
                "url" varchar NOT NULL,
                CONSTRAINT "fk_outgoing_webhook_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_outgoing_webhook_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_outgoing_webhook"(
                    "id",
                    "created",
                    "updated",
                    "platformId",
                    "projectId",
                    "scope",
                    "events",
                    "url"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "projectId",
                "scope",
                "events",
                "url"
            FROM "outgoing_webhook"
        `);
        await queryRunner.query(`
            DROP TABLE "outgoing_webhook"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_outgoing_webhook"
                RENAME TO "outgoing_webhook"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_outgoing_webhook_platform_scope" ON "outgoing_webhook" ("platformId")
            WHERE scope = 'PLATFORM'
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_outgoing_webhook_project_scope" ON "outgoing_webhook" ("projectId")
            WHERE scope = 'PROJECT'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_outgoing_webhook_project_scope"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_outgoing_webhook_platform_scope"
        `);
        await queryRunner.query(`
            ALTER TABLE "outgoing_webhook"
                RENAME TO "temporary_outgoing_webhook"
        `);
        await queryRunner.query(`
            CREATE TABLE "outgoing_webhook" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar(21) NOT NULL,
                "projectId" varchar(21),
                "scope" varchar NOT NULL,
                "events" text NOT NULL,
                "url" varchar NOT NULL
            )
        `);
        await queryRunner.query(`
            INSERT INTO "outgoing_webhook"(
                    "id",
                    "created",
                    "updated",
                    "platformId",
                    "projectId",
                    "scope",
                    "events",
                    "url"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "projectId",
                "scope",
                "events",
                "url"
            FROM "temporary_outgoing_webhook"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_outgoing_webhook"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_outgoing_webhook_project_scope" ON "outgoing_webhook" ("projectId")
            WHERE scope = 'PROJECT'
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_outgoing_webhook_platform_scope" ON "outgoing_webhook" ("platformId")
            WHERE scope = 'PLATFORM'
        `);
        await queryRunner.query(`
            DROP INDEX "idx_outgoing_webhook_project_scope"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_outgoing_webhook_platform_scope"
        `);
        await queryRunner.query(`
            DROP TABLE "outgoing_webhook"
        `);
    }

}
