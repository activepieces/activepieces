import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPlatformRole1713271221154 implements MigrationInterface {
    name = 'AddPlatformRole1713271221154'

    public async up(queryRunner: QueryRunner): Promise<void> {
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
                "externalId" varchar,
                "platformId" varchar,
                "verified" boolean NOT NULL
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
            "externalId" varchar,
            "platformId" varchar,
            "verified" boolean NOT NULL,
            "platformRole" varchar NOT NULL
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
                "externalId",
                "platformId",
                "verified",
                "platformRole"
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
            "externalId",
            "platformId",
            "verified",
            'MEMBER'
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
            UPDATE "user"
            SET "platformRole" = 'ADMIN'
            WHERE "id" IN (
                SELECT "ownerId"
                FROM "platform"
            )
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
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
                "externalId" varchar,
                "platformId" varchar,
                "verified" boolean NOT NULL
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
                "externalId",
                "platformId",
                "verified"
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
                "verified" boolean NOT NULL
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
                "externalId",
                "platformId",
                "verified"
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
    }

}
