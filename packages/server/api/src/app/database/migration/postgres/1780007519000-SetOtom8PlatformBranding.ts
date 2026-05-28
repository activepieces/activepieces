import { MigrationInterface, QueryRunner } from 'typeorm'

export class SetOtom8PlatformBranding1780007519000 implements MigrationInterface {
    name = 'SetOtom8PlatformBranding1780007519000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "platform"
            SET
                "name" = CASE
                    WHEN "name" = 'Activepieces' OR "name" LIKE '%''s Platform' THEN 'otom8'
                    ELSE "name"
                END,
                "logoIconUrl" = CASE
                    WHEN "logoIconUrl" LIKE 'https://cdn.activepieces.com/brand/%' THEN 'https://app.otom8.us/logo.svg'
                    ELSE "logoIconUrl"
                END,
                "fullLogoUrl" = CASE
                    WHEN "fullLogoUrl" LIKE 'https://cdn.activepieces.com/brand/%' THEN 'https://app.otom8.us/logo.svg'
                    ELSE "fullLogoUrl"
                END,
                "favIconUrl" = CASE
                    WHEN "favIconUrl" LIKE 'https://cdn.activepieces.com/brand/%' THEN 'https://app.otom8.us/logo.svg'
                    ELSE "favIconUrl"
                END,
                "updated" = CURRENT_TIMESTAMP
            WHERE
                "name" = 'Activepieces'
                OR "name" LIKE '%''s Platform'
                OR "logoIconUrl" LIKE 'https://cdn.activepieces.com/brand/%'
                OR "fullLogoUrl" LIKE 'https://cdn.activepieces.com/brand/%'
                OR "favIconUrl" LIKE 'https://cdn.activepieces.com/brand/%'
        `)
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // Branding changes are user-facing data and should not be reverted automatically.
    }
}
