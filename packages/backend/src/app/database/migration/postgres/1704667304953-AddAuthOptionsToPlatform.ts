import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAuthOptionsToPlatform1704667304953 implements MigrationInterface {
    name = 'AddAuthOptionsToPlatform1704667304953'

    public async up(queryRunner: QueryRunner): Promise<void> {

        // allowedAuthDomains
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD COLUMN "allowedAuthDomains" character varying[]
        `)
        await queryRunner.query(`
            UPDATE "platform"
            SET "allowedAuthDomains" = '{}'::character varying[]
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
            ALTER COLUMN "allowedAuthDomains" SET NOT NULL
        `)


        // enforceAllowedAuthDomains
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD COLUMN "enforceAllowedAuthDomains" boolean
        `)
        await queryRunner.query(`
            UPDATE "platform"
            SET "enforceAllowedAuthDomains" = false
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
            ALTER COLUMN "enforceAllowedAuthDomains" SET NOT NULL
        `)

        // ssoEnabled
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD COLUMN "ssoEnabled" boolean
        `)
        await queryRunner.query(`
            UPDATE "platform"
            SET "ssoEnabled" = false
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
            ALTER COLUMN "ssoEnabled" SET NOT NULL
        `)

        // federatedAuthProviders
        await queryRunner.query('ALTER TABLE "platform" ADD COLUMN "federatedAuthProviders" jsonb')
        await queryRunner.query('UPDATE "platform" SET "federatedAuthProviders" = \'{}\'')
        await queryRunner.query('ALTER TABLE "platform" ALTER COLUMN "federatedAuthProviders" SET NOT NULL')

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "federatedAuthProviders"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "ssoEnabled"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "enforceAllowedAuthDomains"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "allowedAuthDomains"
        `)
    }

}
