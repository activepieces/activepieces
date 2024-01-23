import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from '../../../helper/logger'
import { apId } from '@activepieces/shared'

export class AddPlatformPostgres1705970370042 implements MigrationInterface {
    name = 'AddPlatformPostgres1705970370042'

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info('AddPlatformPostgres1705970370042 up')
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
                "filteredPieceNames" character varying NOT NULL,
                "filteredPieceBehavior" character varying NOT NULL,
                "gitSyncEnabled" boolean NOT NULL,
                "defaultLocale" character varying,
                "allowedAuthDomains" character varying NOT NULL,
                "enforceAllowedAuthDomains" boolean NOT NULL,
                "ssoEnabled" boolean NOT NULL,
                "emailAuthEnabled" boolean NOT NULL,
                "federatedAuthProviders" jsonb NOT NULL,
                CONSTRAINT "REL_94d6fd6494f0322c6f0e099141" UNIQUE ("ownerId"),
                CONSTRAINT "PK_c33d6abeebd214bd2850bfd6b8e" PRIMARY KEY ("id")
            )
        `)
        await migrateProjects(queryRunner)
        await queryRunner.query(`
            ALTER TABLE "project" DROP COLUMN "type"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_project_platform_id_external_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "project"
            ALTER COLUMN "platformId"
            SET NOT NULL
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_platform_id_external_id" ON "project" ("platformId", "externalId")
        `)
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD CONSTRAINT "fk_project_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
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
            ALTER TABLE "project" DROP CONSTRAINT "fk_project_platform_id"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_project_platform_id_external_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "project"
            ALTER COLUMN "platformId" DROP NOT NULL
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_platform_id_external_id" ON "project" ("platformId", "externalId")
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
        await queryRunner.query(`INSERT INTO platform (id, created, updated, "ownerId", name, "primaryColor", "logoIconUrl", "fullLogoUrl", "favIconUrl", "filteredPieceNames", "filteredPieceBehavior", "smtpHost", "smtpPort", "smtpUser", "smtpPassword", "smtpSenderEmail", "smtpUseSSL", "privacyPolicyUrl", "termsOfServiceUrl", "showPoweredBy", "cloudAuthEnabled", "defaultLocale", "embeddingEnabled", "gitSyncEnabled", "allowedAuthDomains", "enforceAllowedAuthDomains", "ssoEnabled", "federatedAuthProviders", "emailAuthEnabled")
        VALUES 
        ('${platformId}', current_timestamp, current_timestamp, '${ownerId}', 'Activepieces', '#6e41e2', 'https://cdn.activepieces.com/brand/logo.svg', 'https://cdn.activepieces.com/brand/full-logo.png', 'https://cdn.activepieces.com/brand/favicon.ico', '{}', 'BLOCKED', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'f', 't', 'en', 'f', 'f', '{}', 'f', 'f', '{}', 't');
        `)
        await queryRunner.query(`update project set "platformId" = '${platformId}' where id = '${project.id}'`)
        await queryRunner.query(`update public.user set "platformId" = '${platformId}' where id = '${ownerId}'`)
    }
    logger.info('CreateDefaultPlatform1705967115116 up done')
}