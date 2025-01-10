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

        // Check if otp table exists
        const otpTableExists = await queryRunner.hasTable('otp')
        if (otpTableExists) {
            // Drop existing constraints and indexes
            await queryRunner.query(`
                ALTER TABLE "otp" DROP CONSTRAINT "fk_otp_user_id"
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
        }

        // Drop existing constraints and indexes
        await queryRunner.query(`
            DROP INDEX "idx_user_platform_id_email"
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
        // Get all users, ensuring only one row per email
        const users = await queryRunner.query(`
            SELECT DISTINCT ON (LOWER(TRIM("email"))) "id", "email", "password", "trackEvents", "newsLetter", "verified", "firstName", "lastName", "tokenVersion", "created"
            FROM "user"
            ORDER BY LOWER(TRIM("email")), "id"
        `)
        const batchSize = 1000
        const userBatches = []
        for (let i = 0; i < users.length; i += batchSize) {
            userBatches.push(users.slice(i, i + batchSize))
        }

        log.info({
            message: `Found ${userBatches.length} batches of users`,
        })
        let total = 0
        for (let batchIndex = 0; batchIndex < userBatches.length; batchIndex++) {
            const batchOfUsers = userBatches[batchIndex]


            // Prepare the values for all users in the batch
            const values = batchOfUsers.map((user: Record<string, unknown>) => [
                apId(), (user.email as string).trim().toLowerCase(), user.password, user.trackEvents, user.newsLetter,
                user.verified, user.firstName, user.lastName, user.tokenVersion, 'EMAIL', user.created,
            ])

            // Create the insert query for the whole batch
            const insertQuery = `
                INSERT INTO "user_identity" (
                    "id", "email", "password", "trackEvents", "newsLetter", 
                    "verified", "firstName", "lastName", "tokenVersion", "provider", "created"
                ) VALUES 
                ${values.map((_: Record<string, unknown>, index: number) => `($${index * 11 + 1}, $${index * 11 + 2}, $${index * 11 + 3}, $${index * 11 + 4}, $${index * 11 + 5}, $${index * 11 + 6}, $${index * 11 + 7}, $${index * 11 + 8}, $${index * 11 + 9}, $${index * 11 + 10}, $${index * 11 + 11})`).join(', ')}
            `

            // Flatten the values array for binding
            const flattenedValues = values.flat()

            // Execute the batch insert
            await queryRunner.query(insertQuery, flattenedValues)

            total += batchOfUsers.length
            log.info({
                name: this.name,
                message: `Processed ${total} users`,
            })
        }


        await queryRunner.query(`
            ALTER TABLE "user"
            ADD "identityId" character varying
        `)

        // Update identityId in user table based on matching email addresses
        await queryRunner.query(`
            UPDATE "user" AS u
            SET "identityId" = ui.id
            FROM "user_identity" AS ui
            WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(ui.email))
        `)

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
        if (otpTableExists) {
            await queryRunner.query(`
                CREATE UNIQUE INDEX "idx_otp_identity_id_type" ON "otp" ("identityId", "type")
            `)
        }

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD CONSTRAINT "FK_dea97e26c765a4cdb575957a146" FOREIGN KEY ("identityId") REFERENCES "user_identity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
        if (otpTableExists) {
            await queryRunner.query(`
                ALTER TABLE "otp"
                ADD CONSTRAINT "fk_otp_identity_id" FOREIGN KEY ("identityId") REFERENCES "user_identity"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            `)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        log.info({
            name: this.name,
            message: 'Starting down migration',
        })

        // Check if otp table exists
        const otpTableExists = await queryRunner.hasTable('otp')
        if (otpTableExists) {
            // Drop foreign key constraints
            await queryRunner.query(`
                ALTER TABLE "otp" DROP CONSTRAINT "fk_otp_identity_id"
            `)
        }
        await queryRunner.query(`
            ALTER TABLE "user" DROP CONSTRAINT "FK_dea97e26c765a4cdb575957a146"
        `)

        // Drop indexes
        if (otpTableExists) {
            await queryRunner.query(`
                DROP INDEX "idx_otp_identity_id_type"
            `)
        }
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
        if (otpTableExists) {
            await queryRunner.query(`
                ALTER TABLE "otp"
                    RENAME COLUMN "identityId" TO "userId"
            `)
            await queryRunner.query(`
                CREATE UNIQUE INDEX "idx_otp_user_id_type" ON "otp" ("type", "userId")
            `)
            await queryRunner.query(`
                ALTER TABLE "otp"
                ADD CONSTRAINT "fk_otp_user_id" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            `)
        }

        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_email" ON "user" ("email", "platformId")
        `)
    }
}
