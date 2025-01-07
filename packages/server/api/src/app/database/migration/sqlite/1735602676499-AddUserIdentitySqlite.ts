import { apId } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

export class AddUserIdentitySqlite1735602676499 implements MigrationInterface {
    name = 'AddUserIdentitySqlite1735602676499'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const log = system.globalLogger()
        log.info({
            name: this.name,
        }, 'Starting migration')

        // Check for duplicate emails in user table
        const duplicateEmails = await queryRunner.query(`
            SELECT email, COUNT(*) as count
            FROM "user"
            GROUP BY email 
            HAVING COUNT(*) > 1
        `)

        if (duplicateEmails.length > 0) {
            throw new Error('Migration failed: Duplicate emails found in user table. Please resolve duplicate emails before running migration.')
        }

        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_email"
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
            CREATE UNIQUE INDEX "idx_user_identity_email" ON "user_identity" ("email")
        `)

        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_external_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_user" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "status" varchar NOT NULL,
                "externalId" varchar,
                "platformId" varchar,
                "platformRole" varchar NOT NULL,
                "identityId" varchar NOT NULL,
                CONSTRAINT "FK_dea97e26c765a4cdb575957a146" FOREIGN KEY ("identityId") REFERENCES "user_identity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `)

        // Get all existing users
        const users = await queryRunner.query(`
            SELECT * FROM "user"
        `)

        // Insert each user with a new ID and update the reference
        for (const user of users) {
            const identityId = apId()

            // Insert into user_identity
            await queryRunner.query(`
                INSERT INTO "user_identity" (
                    "id", "email", "password", "trackEvents", "newsLetter", 
                    "verified", "firstName", "lastName", "tokenVersion", "provider"
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                identityId, user.email, user.password, user.trackEvents, user.newsLetter,
                user.verified, user.firstName, user.lastName, user.tokenVersion, 'EMAIL',
            ])

            // Insert into temporary_user with identityId
            await queryRunner.query(`
                INSERT INTO "temporary_user" (
                    "id", "created", "updated", "status", "externalId", 
                    "platformId", "platformRole", "identityId"
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                user.id, user.created, user.updated, user.status, user.externalId,
                user.platformId, user.platformRole, identityId,
            ])
        }

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
            CREATE UNIQUE INDEX "idx_user_platform_id_email" ON "user" ("platformId", "identityId")
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
                "verified" boolean NOT NULL,
                "platformRole" varchar NOT NULL,
                "tokenVersion" varchar
            )
        `)
        await queryRunner.query(`
            INSERT INTO "user"(
                    "id",
                    "created",
                    "updated",
                    "status",
                    "externalId",
                    "platformId",
                    "platformRole"
                )
            SELECT "id",
                "created",
                "updated",
                "status",
                "externalId",
                "platformId",
                "platformRole"
            FROM "temporary_user"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_user"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_external_id" ON "user" ("platformId", "externalId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_identity_email"
        `)
        await queryRunner.query(`
            DROP TABLE "user_identity"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_email" ON "user" ("platformId", "email")
        `)
    }

}
