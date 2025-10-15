import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddProfilePictureSqlite1760504355077 implements MigrationInterface {
    name = 'AddProfilePictureSqlite1760504355077'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_user_identity_email"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_user_identity" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "email" varchar NOT NULL,
                "password" varchar NOT NULL,
                "trackEvents" boolean,
                "newsLetter" boolean,
                "verified" boolean NOT NULL DEFAULT (0),
                "firstName" varchar NOT NULL,
                "lastName" varchar NOT NULL,
                "tokenVersion" varchar,
                "provider" varchar NOT NULL,
                "profileImageUrl" varchar,
                CONSTRAINT "UQ_7ad44f9fcbfc95e0a8436bbb029" UNIQUE ("email")
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_user_identity"(
                    "id",
                    "created",
                    "updated",
                    "email",
                    "password",
                    "trackEvents",
                    "newsLetter",
                    "verified",
                    "firstName",
                    "lastName",
                    "tokenVersion",
                    "provider"
                )
            SELECT "id",
                "created",
                "updated",
                "email",
                "password",
                "trackEvents",
                "newsLetter",
                "verified",
                "firstName",
                "lastName",
                "tokenVersion",
                "provider"
            FROM "user_identity"
        `)
        await queryRunner.query(`
            DROP TABLE "user_identity"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_user_identity"
                RENAME TO "user_identity"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_identity_email" ON "user_identity" ("email")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_user_identity_email"
        `)
        await queryRunner.query(`
            ALTER TABLE "user_identity"
                RENAME TO "temporary_user_identity"
        `)
        await queryRunner.query(`
            CREATE TABLE "user_identity" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "email" varchar NOT NULL,
                "password" varchar NOT NULL,
                "trackEvents" boolean,
                "newsLetter" boolean,
                "verified" boolean NOT NULL DEFAULT (0),
                "firstName" varchar NOT NULL,
                "lastName" varchar NOT NULL,
                "tokenVersion" varchar,
                "provider" varchar NOT NULL,
                CONSTRAINT "UQ_7ad44f9fcbfc95e0a8436bbb029" UNIQUE ("email")
            )
        `)
        await queryRunner.query(`
            INSERT INTO "user_identity"(
                    "id",
                    "created",
                    "updated",
                    "email",
                    "password",
                    "trackEvents",
                    "newsLetter",
                    "verified",
                    "firstName",
                    "lastName",
                    "tokenVersion",
                    "provider"
                )
            SELECT "id",
                "created",
                "updated",
                "email",
                "password",
                "trackEvents",
                "newsLetter",
                "verified",
                "firstName",
                "lastName",
                "tokenVersion",
                "provider"
            FROM "temporary_user_identity"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_user_identity"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_identity_email" ON "user_identity" ("email")
        `)
    }

}
