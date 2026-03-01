import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPlatformIdToFileSqlite1701808264444
implements MigrationInterface {
    name = 'AddPlatformIdToFileSqlite1701808264444'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_user_partial_unique_email_platform_id_is_null"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_email"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_external_id"
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
                    "platformId"
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
                "platformId"
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
            CREATE UNIQUE INDEX "idx_user_partial_unique_email_platform_id_is_null" ON "user" ("email")
            WHERE "platformId" IS NULL
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_email" ON "user" ("platformId", "email")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_external_id" ON "user" ("platformId", "externalId")
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_file" (
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
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_file"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "data",
                    "type",
                    "compression"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "data",
                "type",
                "compression"
            FROM "file"
        `)
        await queryRunner.query(`
            DROP TABLE "file"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_file"
                RENAME TO "file"
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
                    "platformId"
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
                "platformId"
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

    public async down(queryRunner: QueryRunner): Promise<void> {
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
                    "platformId"
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
                "platformId"
            FROM "temporary_user"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_user"
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
            ALTER TABLE "file"
                RENAME TO "temporary_file"
        `)
        await queryRunner.query(`
            CREATE TABLE "file" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21),
                "data" blob NOT NULL,
                "type" varchar NOT NULL DEFAULT ('UNKNOWN'),
                "compression" varchar NOT NULL DEFAULT ('NONE'),
                CONSTRAINT "fk_file_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "file"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "data",
                    "type",
                    "compression"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "data",
                "type",
                "compression"
            FROM "temporary_file"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_file"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_external_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_email"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_partial_unique_email_platform_id_is_null"
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
                    "platformId"
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
                "platformId"
            FROM "temporary_user"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_user"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_external_id" ON "user" ("platformId", "externalId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_email" ON "user" ("platformId", "email")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_partial_unique_email_platform_id_is_null" ON "user" ("email")
            WHERE "platformId" IS NULL
        `)
    }
}
