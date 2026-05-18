import { ApEdition, apId } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

export class RenameProjectBillingToPlatformPLan1747819919988 implements MigrationInterface {
    name = 'RenameProjectBillingToPlatformPLan1747819919988'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const tableExists = await queryRunner.hasTable('platform_billing')

        if (tableExists) {
            // Rename platform_billing to platform_plan
            await queryRunner.query(`
                ALTER TABLE "platform_billing" RENAME TO "platform_plan"
            `)

            // Add missing columns to platform_plan
            await queryRunner.query(`
                ALTER TABLE "platform_plan" 
                ADD COLUMN IF NOT EXISTS "environmentsEnabled" boolean,
                ADD COLUMN IF NOT EXISTS "analyticsEnabled" boolean,
                ADD COLUMN IF NOT EXISTS "showPoweredBy" boolean,
                ADD COLUMN IF NOT EXISTS "auditLogEnabled" boolean,
                ADD COLUMN IF NOT EXISTS "embeddingEnabled" boolean,
                ADD COLUMN IF NOT EXISTS "managePiecesEnabled" boolean,
                ADD COLUMN IF NOT EXISTS "manageTemplatesEnabled" boolean,
                ADD COLUMN IF NOT EXISTS "customAppearanceEnabled" boolean,
                ADD COLUMN IF NOT EXISTS "manageProjectsEnabled" boolean,
                ADD COLUMN IF NOT EXISTS "projectRolesEnabled" boolean,
                ADD COLUMN IF NOT EXISTS "customDomainsEnabled" boolean,
                ADD COLUMN IF NOT EXISTS "globalConnectionsEnabled" boolean,
                ADD COLUMN IF NOT EXISTS "customRolesEnabled" boolean,
                ADD COLUMN IF NOT EXISTS "apiKeysEnabled" boolean,
                ADD COLUMN IF NOT EXISTS "alertsEnabled" boolean,
                ADD COLUMN IF NOT EXISTS "ssoEnabled" boolean,
                ADD COLUMN IF NOT EXISTS "licenseKey" character varying,
                ADD COLUMN IF NOT EXISTS "tablesEnabled" boolean,
                ADD COLUMN IF NOT EXISTS "todosEnabled" boolean
            `)

            // Rename the index
            await queryRunner.query(`
                ALTER INDEX IF EXISTS "idx_platform_billing_platform_id" RENAME TO "idx_platform_plan_platform_id"
            `)

            // Rename the foreign key constraint if it exists
            await queryRunner.query(`
                ALTER TABLE "platform_plan" 
                RENAME CONSTRAINT "fk_platform_billing_platform_id" TO "fk_platform_plan_platform_id"
            `)

            const edition = system.getEdition()
            if (edition === ApEdition.ENTERPRISE) {
                // Create platform_plan entries for platforms that don't have one
                const platforms = await queryRunner.query(`
                SELECT p."id"
                FROM "platform" p
                LEFT JOIN "platform_plan" pp ON p."id" = pp."platformId"
                WHERE pp."platformId" IS NULL
            `)

                system.globalLogger().info({
                    count: platforms.length,
                }, 'Creating platform_plan entries for platforms that don\'t have one')

                for (const platform of platforms) {
                    await queryRunner.query(`
                    INSERT INTO "platform_plan" (
                        "id",
                        "platformId",
                        "includedTasks",
                        "tasksLimit",
                        "includedAiCredits",
                        "aiCreditsLimit",
                        "environmentsEnabled",
                        "analyticsEnabled",
                        "showPoweredBy",
                        "auditLogEnabled",
                        "embeddingEnabled",
                        "managePiecesEnabled",
                        "manageTemplatesEnabled",
                        "customAppearanceEnabled",
                        "manageProjectsEnabled",
                        "projectRolesEnabled",
                        "customDomainsEnabled",
                        "globalConnectionsEnabled",
                        "customRolesEnabled",
                        "apiKeysEnabled",
                        "alertsEnabled",
                        "ssoEnabled",
                        "tablesEnabled",
                        "todosEnabled"
                    ) VALUES (
                        $1,
                        $2,
                        0,
                        null,
                        0,
                        null,
                        false,
                        false,
                        false,
                        false,
                        false,
                        false,
                        false,
                        false,
                        false,
                        false,
                        false,
                        false,
                        false,
                        false,
                        false,
                        false,
                        true,
                        true
                    )
                `, [apId(), platform.id])
                }
            }

            // Copy values from platform table to platform_plan
            await queryRunner.query(`
                UPDATE "platform_plan" pp
                SET "environmentsEnabled" = p."environmentsEnabled",
                    "analyticsEnabled" = p."analyticsEnabled",
                    "showPoweredBy" = p."showPoweredBy",
                    "auditLogEnabled" = p."auditLogEnabled",
                    "embeddingEnabled" = p."embeddingEnabled",
                    "managePiecesEnabled" = p."managePiecesEnabled",
                    "manageTemplatesEnabled" = p."manageTemplatesEnabled",
                    "customAppearanceEnabled" = p."customAppearanceEnabled",
                    "manageProjectsEnabled" = p."manageProjectsEnabled",
                    "projectRolesEnabled" = p."projectRolesEnabled",
                    "customDomainsEnabled" = p."customDomainsEnabled",
                    "apiKeysEnabled" = p."apiKeysEnabled",
                    "alertsEnabled" = p."alertsEnabled",
                    "ssoEnabled" = p."ssoEnabled",
                    "licenseKey" = p."licenseKey",
                    "globalConnectionsEnabled" = p."globalConnectionsEnabled",
                    "customRolesEnabled" = p."customRolesEnabled"
                FROM "platform" p
                WHERE pp."platformId" = p."id"
            `)

            // Update tablesEnabled and todosEnabled to true
            await queryRunner.query(`
                UPDATE "platform_plan" 
                SET "tablesEnabled" = true,
                    "todosEnabled" = true
            `)

            // Set NOT NULL constraint after copying data
            await queryRunner.query(`
                ALTER TABLE "platform_plan" 
                ALTER COLUMN "environmentsEnabled" SET NOT NULL,
                ALTER COLUMN "analyticsEnabled" SET NOT NULL,
                ALTER COLUMN "showPoweredBy" SET NOT NULL,
                ALTER COLUMN "auditLogEnabled" SET NOT NULL,
                ALTER COLUMN "embeddingEnabled" SET NOT NULL,
                ALTER COLUMN "managePiecesEnabled" SET NOT NULL,
                ALTER COLUMN "manageTemplatesEnabled" SET NOT NULL,
                ALTER COLUMN "customAppearanceEnabled" SET NOT NULL,
                ALTER COLUMN "manageProjectsEnabled" SET NOT NULL,
                ALTER COLUMN "projectRolesEnabled" SET NOT NULL,
                ALTER COLUMN "customDomainsEnabled" SET NOT NULL,
                ALTER COLUMN "globalConnectionsEnabled" SET NOT NULL,
                ALTER COLUMN "customRolesEnabled" SET NOT NULL,
                ALTER COLUMN "apiKeysEnabled" SET NOT NULL,
                ALTER COLUMN "alertsEnabled" SET NOT NULL,
                ALTER COLUMN "ssoEnabled" SET NOT NULL,
                ALTER COLUMN "tablesEnabled" SET NOT NULL,
                ALTER COLUMN "todosEnabled" SET NOT NULL
            `)
        }

        await queryRunner.query(`
            ALTER TABLE "platform" 
            DROP COLUMN "showPoweredBy",
            DROP COLUMN "embeddingEnabled",
            DROP COLUMN "environmentsEnabled",
            DROP COLUMN "ssoEnabled",
            DROP COLUMN "auditLogEnabled",
            DROP COLUMN "customDomainsEnabled",
            DROP COLUMN "customAppearanceEnabled",
            DROP COLUMN "manageProjectsEnabled",
            DROP COLUMN "managePiecesEnabled",
            DROP COLUMN "manageTemplatesEnabled",
            DROP COLUMN "apiKeysEnabled",
            DROP COLUMN "projectRolesEnabled",
            DROP COLUMN "flowIssuesEnabled",
            DROP COLUMN "alertsEnabled",
            DROP COLUMN "analyticsEnabled",
            DROP COLUMN "licenseKey",
            DROP COLUMN "globalConnectionsEnabled",
            DROP COLUMN "customRolesEnabled"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Add columns back to platform table
        await queryRunner.query(`
            ALTER TABLE "platform" 
            ADD COLUMN IF NOT EXISTS "showPoweredBy" boolean,
            ADD COLUMN IF NOT EXISTS "embeddingEnabled" boolean,
            ADD COLUMN IF NOT EXISTS "environmentsEnabled" boolean,
            ADD COLUMN IF NOT EXISTS "ssoEnabled" boolean,
            ADD COLUMN IF NOT EXISTS "auditLogEnabled" boolean,
            ADD COLUMN IF NOT EXISTS "customDomainsEnabled" boolean,
            ADD COLUMN IF NOT EXISTS "customAppearanceEnabled" boolean,
            ADD COLUMN IF NOT EXISTS "manageProjectsEnabled" boolean,
            ADD COLUMN IF NOT EXISTS "managePiecesEnabled" boolean,
            ADD COLUMN IF NOT EXISTS "manageTemplatesEnabled" boolean,
            ADD COLUMN IF NOT EXISTS "apiKeysEnabled" boolean,
            ADD COLUMN IF NOT EXISTS "projectRolesEnabled" boolean,
            ADD COLUMN IF NOT EXISTS "flowIssuesEnabled" boolean,
            ADD COLUMN IF NOT EXISTS "alertsEnabled" boolean,
            ADD COLUMN IF NOT EXISTS "analyticsEnabled" boolean,
            ADD COLUMN IF NOT EXISTS "licenseKey" character varying,
            ADD COLUMN IF NOT EXISTS "globalConnectionsEnabled" boolean,
            ADD COLUMN IF NOT EXISTS "customRolesEnabled" boolean
        `)

        // Copy data back from platform_plan to platform
        await queryRunner.query(`
            UPDATE "platform" p
            SET "environmentsEnabled" = pp."environmentsEnabled",
                "analyticsEnabled" = pp."analyticsEnabled",
                "showPoweredBy" = pp."showPoweredBy",
                "auditLogEnabled" = pp."auditLogEnabled",
                "embeddingEnabled" = pp."embeddingEnabled",
                "managePiecesEnabled" = pp."managePiecesEnabled",
                "manageTemplatesEnabled" = pp."manageTemplatesEnabled",
                "customAppearanceEnabled" = pp."customAppearanceEnabled",
                "manageProjectsEnabled" = pp."manageProjectsEnabled",
                "projectRolesEnabled" = pp."projectRolesEnabled",
                "customDomainsEnabled" = pp."customDomainsEnabled",
                "apiKeysEnabled" = pp."apiKeysEnabled",
                "alertsEnabled" = pp."alertsEnabled",
                "ssoEnabled" = pp."ssoEnabled",
                "licenseKey" = pp."licenseKey",
                "globalConnectionsEnabled" = pp."globalConnectionsEnabled",
                "customRolesEnabled" = pp."customRolesEnabled",
                "flowIssuesEnabled" = true
            FROM "platform_plan" pp
            WHERE p."id" = pp."platformId"
        `)

        const platformPlanExists = await queryRunner.hasTable('platform_plan')

        if (platformPlanExists) {
            // Drop newly added columns before renaming the table back
            await queryRunner.query(`
                ALTER TABLE "platform_plan" 
                DROP COLUMN IF EXISTS "environmentsEnabled",
                DROP COLUMN IF EXISTS "analyticsEnabled",
                DROP COLUMN IF EXISTS "showPoweredBy",
                DROP COLUMN IF EXISTS "auditLogEnabled",
                DROP COLUMN IF EXISTS "embeddingEnabled",
                DROP COLUMN IF EXISTS "managePiecesEnabled",
                DROP COLUMN IF EXISTS "manageTemplatesEnabled",
                DROP COLUMN IF EXISTS "customAppearanceEnabled",
                DROP COLUMN IF EXISTS "manageProjectsEnabled",
                DROP COLUMN IF EXISTS "projectRolesEnabled",
                DROP COLUMN IF EXISTS "customDomainsEnabled",
                DROP COLUMN IF EXISTS "globalConnectionsEnabled",
                DROP COLUMN IF EXISTS "customRolesEnabled",
                DROP COLUMN IF EXISTS "apiKeysEnabled",
                DROP COLUMN IF EXISTS "alertsEnabled",
                DROP COLUMN IF EXISTS "ssoEnabled",
                DROP COLUMN IF EXISTS "licenseKey",
                DROP COLUMN IF EXISTS "tablesEnabled",
                DROP COLUMN IF EXISTS "todosEnabled"
            `)

            // Rename foreign key constraint back
            await queryRunner.query(`
                ALTER TABLE "platform_plan" 
                RENAME CONSTRAINT "fk_platform_plan_platform_id" TO "fk_platform_billing_platform_id"
            `)

            // Rename index back
            await queryRunner.query(`
                ALTER INDEX IF EXISTS "idx_platform_plan_platform_id" RENAME TO "idx_platform_billing_platform_id"
            `)

            // Rename table back to platform_billing
            await queryRunner.query(`
                ALTER TABLE "platform_plan" RENAME TO "platform_billing"
            `)
        }
    }
}
