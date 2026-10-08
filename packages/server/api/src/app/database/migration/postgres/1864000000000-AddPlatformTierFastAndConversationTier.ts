import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddPlatformTierFastAndConversationTier1864000000000 implements Migration {
    name = 'AddPlatformTierFastAndConversationTier1864000000000'
    breaking = false
    release = '0.93.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_model_tier"
            ADD "isFast" boolean NOT NULL DEFAULT false
        `)
        await queryRunner.query(`
            UPDATE "platform_model_tier" SET "isFast" = true WHERE "isDefault" = true AND "deleted" IS NULL
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_platform_model_tier_platform_fast" ON "platform_model_tier" ("platformId") WHERE "isFast" = true AND "deleted" IS NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "agent_conversation"
            ADD "modelTierId" character varying(21)
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "agent_conversation" DROP COLUMN "modelTierId"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_platform_model_tier_platform_fast"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_model_tier" DROP COLUMN "isFast"
        `)
    }
}
