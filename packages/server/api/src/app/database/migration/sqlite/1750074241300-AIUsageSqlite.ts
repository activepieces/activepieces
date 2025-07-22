import { MigrationInterface, QueryRunner } from 'typeorm'

export class AIUsageSqlite1750074241300 implements MigrationInterface {
    name = 'AIUsageSqlite1750074241300'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "ai_usage" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "provider" varchar NOT NULL,
                "model" varchar NOT NULL,
                "cost" decimal NOT NULL,
                "projectId" varchar(21) NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_ai_usage_project_created" ON "ai_usage" ("projectId", "created")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_ai_provider_platform_id_provider"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_ai_provider" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar NOT NULL,
                "config" text NOT NULL,
                "provider" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_ai_provider"(
                    "id",
                    "created",
                    "updated",
                    "platformId",
                    "config",
                    "provider"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "config",
                "provider"
            FROM "ai_provider"
        `)
        await queryRunner.query(`
            DROP TABLE "ai_provider"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_ai_provider"
                RENAME TO "ai_provider"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_ai_provider_platform_id_provider" ON "ai_provider" ("platformId", "provider")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_ai_provider_platform_id_provider"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_ai_provider" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar(21) NOT NULL,
                "config" text NOT NULL,
                "provider" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_ai_provider"(
                    "id",
                    "created",
                    "updated",
                    "platformId",
                    "config",
                    "provider"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "config",
                "provider"
            FROM "ai_provider"
        `)
        await queryRunner.query(`
            DROP TABLE "ai_provider"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_ai_provider"
                RENAME TO "ai_provider"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_ai_provider_platform_id_provider" ON "ai_provider" ("platformId", "provider")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_ai_provider_platform_id_provider"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_ai_provider" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar(21) NOT NULL,
                "config" text NOT NULL,
                "provider" varchar NOT NULL,
                CONSTRAINT "fk_ai_provider_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_ai_provider"(
                    "id",
                    "created",
                    "updated",
                    "platformId",
                    "config",
                    "provider"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "config",
                "provider"
            FROM "ai_provider"
        `)
        await queryRunner.query(`
            DROP TABLE "ai_provider"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_ai_provider"
                RENAME TO "ai_provider"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_ai_provider_platform_id_provider" ON "ai_provider" ("platformId", "provider")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_ai_usage_project_created"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_ai_usage" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "provider" varchar NOT NULL,
                "model" varchar NOT NULL,
                "cost" decimal NOT NULL,
                "projectId" varchar(21) NOT NULL,
                CONSTRAINT "fk_ai_usage_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_ai_usage"(
                    "id",
                    "created",
                    "updated",
                    "provider",
                    "model",
                    "cost",
                    "projectId"
                )
            SELECT "id",
                "created",
                "updated",
                "provider",
                "model",
                "cost",
                "projectId"
            FROM "ai_usage"
        `)
        await queryRunner.query(`
            DROP TABLE "ai_usage"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_ai_usage"
                RENAME TO "ai_usage"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_ai_usage_project_created" ON "ai_usage" ("projectId", "created")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_ai_usage_project_created"
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_usage"
                RENAME TO "temporary_ai_usage"
        `)
        await queryRunner.query(`
            CREATE TABLE "ai_usage" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "provider" varchar NOT NULL,
                "model" varchar NOT NULL,
                "cost" decimal NOT NULL,
                "projectId" varchar(21) NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "ai_usage"(
                    "id",
                    "created",
                    "updated",
                    "provider",
                    "model",
                    "cost",
                    "projectId"
                )
            SELECT "id",
                "created",
                "updated",
                "provider",
                "model",
                "cost",
                "projectId"
            FROM "temporary_ai_usage"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_ai_usage"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_ai_usage_project_created" ON "ai_usage" ("projectId", "created")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_ai_provider_platform_id_provider"
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_provider"
                RENAME TO "temporary_ai_provider"
        `)
        await queryRunner.query(`
            CREATE TABLE "ai_provider" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar(21) NOT NULL,
                "config" text NOT NULL,
                "provider" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "ai_provider"(
                    "id",
                    "created",
                    "updated",
                    "platformId",
                    "config",
                    "provider"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "config",
                "provider"
            FROM "temporary_ai_provider"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_ai_provider"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_ai_provider_platform_id_provider" ON "ai_provider" ("platformId", "provider")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_ai_provider_platform_id_provider"
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_provider"
                RENAME TO "temporary_ai_provider"
        `)
        await queryRunner.query(`
            CREATE TABLE "ai_provider" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar NOT NULL,
                "config" text NOT NULL,
                "provider" varchar NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "ai_provider"(
                    "id",
                    "created",
                    "updated",
                    "platformId",
                    "config",
                    "provider"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "config",
                "provider"
            FROM "temporary_ai_provider"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_ai_provider"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_ai_provider_platform_id_provider" ON "ai_provider" ("platformId", "provider")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_ai_provider_platform_id_provider"
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_provider"
                RENAME TO "temporary_ai_provider"
        `)
        await queryRunner.query(`
            CREATE TABLE "ai_provider" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar NOT NULL,
                "config" text NOT NULL,
                "provider" varchar NOT NULL,
                CONSTRAINT "fk_ai_provider_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "ai_provider"(
                    "id",
                    "created",
                    "updated",
                    "platformId",
                    "config",
                    "provider"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "config",
                "provider"
            FROM "temporary_ai_provider"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_ai_provider"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_ai_provider_platform_id_provider" ON "ai_provider" ("platformId", "provider")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_ai_usage_project_created"
        `)
        await queryRunner.query(`
            DROP TABLE "ai_usage"
        `)
    }

}
