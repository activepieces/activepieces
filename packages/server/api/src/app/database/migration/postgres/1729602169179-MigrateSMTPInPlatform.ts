import { logger } from '@activepieces/server-shared'
import { MigrationInterface, QueryRunner } from 'typeorm'

export class MigrateSMTPInPlatform1729602169179 implements MigrationInterface {
    name = 'MigrateSMTPInPlatform1729602169179'

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info({
            name: this.name,
        }, 'up')
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "smtp" jsonb
        `)
        // Data migration
        await queryRunner.query(`
            UPDATE "platform"
            SET "smtp" = jsonb_build_object(
                'user', "smtpUser",
                'senderEmail', "smtpSenderEmail",
                'senderName', '',
                'password', "smtpPassword",
                'host', "smtpHost",
                'port', "smtpPort"
            )
        `)

        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "smtpHost"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "smtpPort"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "smtpUser"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "smtpPassword"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "smtpSenderEmail"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "smtpUseSSL"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "privacyPolicyUrl"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "termsOfServiceUrl"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        logger.info({
            name: this.name,
        }, 'down')
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "termsOfServiceUrl" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "privacyPolicyUrl" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "smtpUseSSL" boolean
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "smtpSenderEmail" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "smtpPassword" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "smtpUser" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "smtpPort" integer
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "smtpHost" character varying
        `)
        // Data migration
        await queryRunner.query(`
            UPDATE "platform"
            SET "smtpUser" = "smtp"->>'user',
                "smtpSenderEmail" = "smtp"->>'senderEmail',
                "smtpPassword" = "smtp"->>'password',
                "smtpHost" = "smtp"->>'host',
                "smtpPort" = ("smtp"->>'port')::integer
        `)

        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "smtp"
        `)
       
    }

}
