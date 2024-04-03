import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from '@activepieces/server-shared'
import { apId } from '@activepieces/shared'

export class AddPlatformToPostgres1709052740378 implements MigrationInterface {
    name = 'AddPlatformToPostgres1709052740378'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "platform" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "ownerId" character varying(21) NOT NULL,
                "name" character varying NOT NULL,
                "primaryColor" character varying NOT NULL,
                "logoIconUrl" character varying NOT NULL,
                "fullLogoUrl" character varying NOT NULL,
                "favIconUrl" character varying NOT NULL,
                "smtpHost" character varying,
                "smtpPort" integer,
                "smtpUser" character varying,
                "smtpPassword" character varying,
                "smtpSenderEmail" character varying,
                "smtpUseSSL" boolean,
                "privacyPolicyUrl" character varying,
                "termsOfServiceUrl" character varying,
                "showPoweredBy" boolean NOT NULL,
                "cloudAuthEnabled" boolean NOT NULL DEFAULT true,
                "embeddingEnabled" boolean NOT NULL DEFAULT true,
                "filteredPieceNames" character varying array NOT NULL,
                "filteredPieceBehavior" character varying NOT NULL,
                "gitSyncEnabled" boolean NOT NULL,
                "defaultLocale" character varying,
                "allowedAuthDomains" character varying array NOT NULL,
                "enforceAllowedAuthDomains" boolean NOT NULL,
                "ssoEnabled" boolean NOT NULL,
                "emailAuthEnabled" boolean NOT NULL,
                "federatedAuthProviders" jsonb NOT NULL,
                "auditLogEnabled" boolean NOT NULL,
                "showActivityLog" boolean NOT NULL,
                CONSTRAINT "REL_94d6fd6494f0322c6f0e099141" UNIQUE ("ownerId"),
                CONSTRAINT "PK_c33d6abeebd214bd2850bfd6b8e" PRIMARY KEY ("id")
            )
        `)
        await migrateProjects(queryRunner)
        await queryRunner.query(`
            ALTER TABLE "project" DROP COLUMN "type"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD CONSTRAINT "fk_platform_user" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform" DROP CONSTRAINT "fk_platform_user"
        `)
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD "type" character varying NOT NULL DEFAULT 'STANDALONE'
        `)
        await queryRunner.query(`
            DROP TABLE "platform"
        `)
    }

}

async function migrateProjects(queryRunner: QueryRunner) {
    logger.info('CreateDefaultPlatform1705967115116 up')
    const standaloneProjects = await queryRunner.query('select * from project where "platformId" is null;')
    logger.info(`Found ${standaloneProjects.length} standalone projects`)
    for (const project of standaloneProjects) {
        const ownerId = project.ownerId
        const platformId = apId()
        await queryRunner.query(
            `INSERT INTO "platform"
            ("id", "created", "updated", "ownerId", "name", "primaryColor",
            "logoIconUrl", "fullLogoUrl", "favIconUrl", "filteredPieceNames",
            "filteredPieceBehavior", "smtpHost", "smtpPort", "smtpUser",
            "smtpPassword", "smtpSenderEmail", "smtpUseSSL", "privacyPolicyUrl",
            "termsOfServiceUrl", "showPoweredBy", "cloudAuthEnabled",
            "defaultLocale", "embeddingEnabled", "gitSyncEnabled",
            "allowedAuthDomains", "enforceAllowedAuthDomains", "ssoEnabled",
            "federatedAuthProviders", "emailAuthEnabled", "auditLogEnabled",
            "showActivityLog")
            VALUES
            ($1, current_timestamp, current_timestamp, $2, 'Activepieces',
            '#6e41e2', 'https://cdn.activepieces.com/brand/logo.svg',
            'https://cdn.activepieces.com/brand/full-logo.png',
            'https://cdn.activepieces.com/brand/favicon.ico', '{}',
            'BLOCKED', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
            'f', 't', 'en', 'f', 'f', '{}', 'f', 'f', '{}', 'f', 'f', 'f');`,
            [platformId, ownerId],
        )
        await queryRunner.query(`update "project" set "platformId" = '${platformId}' where "id" = '${project.id}'`)
        await queryRunner.query(`update "user" set "platformId" = '${platformId}' where "id" = '${ownerId}'`)
    }
    logger.info('CreateDefaultPlatform1705967115116 up done')
}
