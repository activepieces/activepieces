import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddAiProviderStatus1829000000000 implements Migration {
    name = 'AddAiProviderStatus1829000000000'
    breaking = false
    release = '0.88.1'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "ai_provider"
            ADD COLUMN IF NOT EXISTS "status" character varying DEFAULT 'active',
            ADD COLUMN IF NOT EXISTS "statusReason" character varying,
            ADD COLUMN IF NOT EXISTS "statusUpdated" TIMESTAMP WITH TIME ZONE
        `)
        await queryRunner.query(`
            UPDATE "ai_provider" SET "status" = 'active' WHERE "status" IS NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_provider"
            ALTER COLUMN "status" SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "ai_provider"
            DROP COLUMN "status",
            DROP COLUMN "statusReason",
            DROP COLUMN "statusUpdated"
        `)
    }
}
