import { apId } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()
export class AddUserIdentity1735590074879 implements MigrationInterface {
    name = 'AddUserIdentity1735590074879'
    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info({
            name: this.name,
            message: 'Starting migration',
        })
        // Check for duplicate emails in user table
        const duplicateEmails = await queryRunner.query(`
            SELECT email, COUNT(*) 
            FROM "user"
            GROUP BY email 
            HAVING COUNT(*) > 1
        `)

        if (duplicateEmails.length > 0) {
            throw new Error('Migration failed: Duplicate emails found in user table. Please resolve duplicate emails before running migration.')
        }

        // Drop existing constraints and indexes
        await queryRunner.query(`
            ALTER TABLE "otp" DROP CONSTRAINT "fk_otp_user_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_email"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_otp_user_id_type"
        `)

        // Clean and modify OTP table
        await queryRunner.query(`
            DELETE FROM "otp"
        `)
        await queryRunner.query(`
            ALTER TABLE "otp"
                RENAME COLUMN "userId" TO "identityId"
        `)

        // Create user_identity table
        await queryRunner.query(`
            CREATE TABLE "user_identity" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "email" character varying NOT NULL,
                "password" character varying NOT NULL,
                "trackEvents" boolean,
                "newsLetter" boolean,
                "verified" boolean NOT NULL DEFAULT false,
                "firstName" character varying NOT NULL,
                "lastName" character varying NOT NULL,
                "tokenVersion" character varying,
                "provider" character varying NOT NULL,
                CONSTRAINT "UQ_7ad44f9fcbfc95e0a8436bbb029" UNIQUE ("email"),
                CONSTRAINT "PK_87b5856b206b5b77e6e2fa29508" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_identity_email" ON "user_identity" ("email")
        `)


        // Migrate user data to user_identity
        // Get all users first
        const users = await queryRunner.query(`
            SELECT "id", "email", "password", "trackEvents", "newsLetter", "verified", "firstName", "lastName", "tokenVersion"
            FROM "user"
        `)

        // Add identity reference to user table as nullable first
        await queryRunner.query(`
                ALTER TABLE "user"
                ADD "identityId" character varying
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
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [
                identityId, user.email, user.password, user.trackEvents, user.newsLetter,
                user.verified, user.firstName, user.lastName, user.tokenVersion, 'EMAIL',
            ])

            // Link identity to user
            await queryRunner.query(`
                UPDATE "user" 
                SET "identityId" = $1
                WHERE id = $2
            `, [identityId, user.id])
        }

        // Make identityId not null after linking
        await queryRunner.query(`
            ALTER TABLE "user"
            ALTER COLUMN "identityId" SET NOT NULL
        `)

        // Drop columns from user table
        await queryRunner.query(`
            ALTER TABLE "user" DROP COLUMN "email"
        `)
        await queryRunner.query(`
            ALTER TABLE "user" DROP COLUMN "firstName"
        `)
        await queryRunner.query(`
            ALTER TABLE "user" DROP COLUMN "lastName"
        `)
        await queryRunner.query(`
            ALTER TABLE "user" DROP COLUMN "password"
        `)
        await queryRunner.query(`
            ALTER TABLE "user" DROP COLUMN "trackEvents"
        `)
        await queryRunner.query(`
            ALTER TABLE "user" DROP COLUMN "newsLetter"
        `)
        await queryRunner.query(`
            ALTER TABLE "user" DROP COLUMN "verified"
        `)
        await queryRunner.query(`
            ALTER TABLE "user" DROP COLUMN "tokenVersion"
        `)


        // Create new indexes
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_email" ON "user" ("platformId", "identityId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_otp_identity_id_type" ON "otp" ("identityId", "type")
        `)

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD CONSTRAINT "FK_dea97e26c765a4cdb575957a146" FOREIGN KEY ("identityId") REFERENCES "user_identity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "otp"
            ADD CONSTRAINT "fk_otp_identity_id" FOREIGN KEY ("identityId") REFERENCES "user_identity"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)


    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "otp" DROP CONSTRAINT "fk_otp_identity_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "user" DROP CONSTRAINT "FK_dea97e26c765a4cdb575957a146"
        `)

        // Drop indexes
        await queryRunner.query(`
            DROP INDEX "idx_otp_identity_id_type"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_email"
        `)

        // Remove identity reference from user table
        await queryRunner.query(`
            ALTER TABLE "user" DROP COLUMN "identityId"
        `)

        // Restore user table columns
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD "tokenVersion" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD "verified" boolean NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD "newsLetter" boolean
        `)
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD "trackEvents" boolean
        `)
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD "password" character varying NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD "lastName" character varying NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD "firstName" character varying NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD "email" character varying NOT NULL
        `)

        // Clean up user_identity table
        await queryRunner.query(`
            DROP INDEX "idx_user_identity_email"
        `)
        await queryRunner.query(`
            DROP TABLE "user_identity"
        `)

        // Restore OTP table
        await queryRunner.query(`
            ALTER TABLE "otp"
                RENAME COLUMN "identityId" TO "userId"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_otp_user_id_type" ON "otp" ("type", "userId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_email" ON "user" ("email", "platformId")
        `)
        await queryRunner.query(`
            ALTER TABLE "otp"
            ADD CONSTRAINT "fk_otp_user_id" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)



    }

}
