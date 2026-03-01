import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUniqueStoreConstraint1708527446535 implements MigrationInterface {
    name = 'AddUniqueStoreConstraint1708527446535'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
        DELETE FROM "store-entry" AS se WHERE ("se"."projectId", "se"."key", "se"."created") NOT IN (SELECT "projectId", "key", MAX("created") FROM "store-entry" GROUP BY "projectId", "key");
    `)
        await queryRunner.query(`
            DELETE FROM "store-entry"
            WHERE LENGTH("key") > 128
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_email"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_external_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_partial_unique_email_platform_id_is_null"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_user" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "email" varchar NOT NULL,
                "firstName" varchar NOT NULL,
                "lastName" varchar NOT NULL,
                "password" varchar NOT NULL,
                "status" varchar NOT NULL,
                "trackEvents" boolean,
                "newsLetter" boolean,
                "imageUrl" varchar,
                "title" varchar,
                "externalId" varchar,
                "platformId" varchar,
                "verified" boolean NOT NULL,
                CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email")
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_user"(
                    "id",
                    "created",
                    "updated",
                    "email",
                    "firstName",
                    "lastName",
                    "password",
                    "status",
                    "trackEvents",
                    "newsLetter",
                    "imageUrl",
                    "title",
                    "externalId",
                    "platformId",
                    "verified"
                )
            SELECT "id",
                "created",
                "updated",
                "email",
                "firstName",
                "lastName",
                "password",
                "status",
                "trackEvents",
                "newsLetter",
                "imageUrl",
                "title",
                "externalId",
                "platformId",
                "verified"
            FROM "user"
        `)
        await queryRunner.query(`
            DROP TABLE "user"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_user"
                RENAME TO "user"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_email" ON "user" ("platformId", "email")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_external_id" ON "user" ("platformId", "externalId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_partial_unique_email_platform_id_is_null" ON "user" ("email")
            WHERE "platformId" IS NULL
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_store-entry" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "key" varchar(128) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "value" text
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_store-entry"(
                    "id",
                    "created",
                    "updated",
                    "key",
                    "projectId",
                    "value"
                )
            SELECT "id",
                "created",
                "updated",
                "key",
                "projectId",
                "value"
            FROM "store-entry"
        `)
        await queryRunner.query(`
            DROP TABLE "store-entry"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_store-entry"
                RENAME TO "store-entry"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_email"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_external_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_partial_unique_email_platform_id_is_null"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_user" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "email" varchar NOT NULL,
                "firstName" varchar NOT NULL,
                "lastName" varchar NOT NULL,
                "password" varchar NOT NULL,
                "status" varchar NOT NULL,
                "trackEvents" boolean,
                "newsLetter" boolean,
                "imageUrl" varchar,
                "title" varchar,
                "externalId" varchar,
                "platformId" varchar,
                "verified" boolean NOT NULL,
                CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email")
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_user"(
                    "id",
                    "created",
                    "updated",
                    "email",
                    "firstName",
                    "lastName",
                    "password",
                    "status",
                    "trackEvents",
                    "newsLetter",
                    "imageUrl",
                    "title",
                    "externalId",
                    "platformId",
                    "verified"
                )
            SELECT "id",
                "created",
                "updated",
                "email",
                "firstName",
                "lastName",
                "password",
                "status",
                "trackEvents",
                "newsLetter",
                "imageUrl",
                "title",
                "externalId",
                "platformId",
                "verified"
            FROM "user"
        `)
        await queryRunner.query(`
            DROP TABLE "user"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_user"
                RENAME TO "user"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_external_id" ON "user" ("platformId", "externalId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_partial_unique_email_platform_id_is_null" ON "user" ("email")
            WHERE "platformId" IS NULL
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_email" ON "user" ("platformId", "email")
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_store-entry" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "key" varchar(128) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "value" text,
                CONSTRAINT "UQ_6f251cc141de0a8d84d7a4ac17d" UNIQUE ("projectId", "key")
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_store-entry"(
                    "id",
                    "created",
                    "updated",
                    "key",
                    "projectId",
                    "value"
                )
            SELECT "id",
                "created",
                "updated",
                "key",
                "projectId",
                "value"
            FROM "store-entry"
        `)
        await queryRunner.query(`
            DROP TABLE "store-entry"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_store-entry"
                RENAME TO "store-entry"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "store-entry"
                RENAME TO "temporary_store-entry"
        `)
        await queryRunner.query(`
            CREATE TABLE "store-entry" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "key" varchar(128) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "value" text
            )
        `)
        await queryRunner.query(`
            INSERT INTO "store-entry"(
                    "id",
                    "created",
                    "updated",
                    "key",
                    "projectId",
                    "value"
                )
            SELECT "id",
                "created",
                "updated",
                "key",
                "projectId",
                "value"
            FROM "temporary_store-entry"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_store-entry"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_email"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_partial_unique_email_platform_id_is_null"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_external_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "user"
                RENAME TO "temporary_user"
        `)
        await queryRunner.query(`
            CREATE TABLE "user" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "email" varchar NOT NULL,
                "firstName" varchar NOT NULL,
                "lastName" varchar NOT NULL,
                "password" varchar NOT NULL,
                "status" varchar NOT NULL,
                "trackEvents" boolean,
                "newsLetter" boolean,
                "imageUrl" varchar,
                "title" varchar,
                "externalId" varchar,
                "platformId" varchar,
                "verified" boolean NOT NULL,
                CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email")
            )
        `)
        await queryRunner.query(`
            INSERT INTO "user"(
                    "id",
                    "created",
                    "updated",
                    "email",
                    "firstName",
                    "lastName",
                    "password",
                    "status",
                    "trackEvents",
                    "newsLetter",
                    "imageUrl",
                    "title",
                    "externalId",
                    "platformId",
                    "verified"
                )
            SELECT "id",
                "created",
                "updated",
                "email",
                "firstName",
                "lastName",
                "password",
                "status",
                "trackEvents",
                "newsLetter",
                "imageUrl",
                "title",
                "externalId",
                "platformId",
                "verified"
            FROM "temporary_user"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_user"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_partial_unique_email_platform_id_is_null" ON "user" ("email")
            WHERE "platformId" IS NULL
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_external_id" ON "user" ("platformId", "externalId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_email" ON "user" ("platformId", "email")
        `)
        await queryRunner.query(`
            ALTER TABLE "store-entry"
                RENAME TO "temporary_store-entry"
        `)
        await queryRunner.query(`
            CREATE TABLE "store-entry" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "key" varchar NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "value" text
            )
        `)
        await queryRunner.query(`
            INSERT INTO "store-entry"(
                    "id",
                    "created",
                    "updated",
                    "key",
                    "projectId",
                    "value"
                )
            SELECT "id",
                "created",
                "updated",
                "key",
                "projectId",
                "value"
            FROM "temporary_store-entry"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_store-entry"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_partial_unique_email_platform_id_is_null"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_external_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_email"
        `)
        await queryRunner.query(`
            ALTER TABLE "user"
                RENAME TO "temporary_user"
        `)
        await queryRunner.query(`
            CREATE TABLE "user" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "email" varchar NOT NULL,
                "firstName" varchar NOT NULL,
                "lastName" varchar NOT NULL,
                "password" varchar NOT NULL,
                "status" varchar NOT NULL,
                "trackEvents" boolean,
                "newsLetter" boolean,
                "imageUrl" varchar,
                "title" varchar,
                "externalId" varchar,
                "platformId" varchar,
                "verified" boolean NOT NULL,
                CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email")
            )
        `)
        await queryRunner.query(`
            INSERT INTO "user"(
                    "id",
                    "created",
                    "updated",
                    "email",
                    "firstName",
                    "lastName",
                    "password",
                    "status",
                    "trackEvents",
                    "newsLetter",
                    "imageUrl",
                    "title",
                    "externalId",
                    "platformId",
                    "verified"
                )
            SELECT "id",
                "created",
                "updated",
                "email",
                "firstName",
                "lastName",
                "password",
                "status",
                "trackEvents",
                "newsLetter",
                "imageUrl",
                "title",
                "externalId",
                "platformId",
                "verified"
            FROM "temporary_user"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_user"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_partial_unique_email_platform_id_is_null" ON "user" ("email")
            WHERE "platformId" IS NULL
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_external_id" ON "user" ("platformId", "externalId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_email" ON "user" ("platformId", "email")
        `)
    }

}
