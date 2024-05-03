import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'
import { ApEdition } from '@activepieces/shared'

export class AddSmtpAndPrivacyUrlToPlatform1699491705906
implements MigrationInterface {
    name = 'AddSmtpAndPrivacyUrlToPlatform1699491705906'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "smtpHost" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "smtpPort" integer
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "smtpUser" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "smtpPassword" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "smtpSenderEmail" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "smtpUseSSL" boolean
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "privacyPolicyUrl" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "termsOfServiceUrl" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "showPoweredBy" boolean
        `)

        await queryRunner.query(`
            UPDATE "platform"
            SET "showPoweredBy" = false
        `)

        await queryRunner.query(`
        ALTER TABLE "platform"
        ALTER COLUMN "showPoweredBy" SET NOT NULL
    `)

        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "cloudAuthEnabled" boolean NOT NULL DEFAULT true
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
        ALTER TABLE "platform" DROP COLUMN "cloudAuthEnabled"
    `)
        await queryRunner.query(`
        ALTER TABLE "platform" DROP COLUMN "showPoweredBy"
    `)
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "termsOfServiceUrl"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "privacyPolicyUrl"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "smtpUseSSL"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "smtpSenderEmail"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "smtpPassword"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "smtpUser"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "smtpPort"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "smtpHost"
        `)
    }
}
