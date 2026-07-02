import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddChatRolloutFreeCreditGrant1802000000000 implements Migration {
    name = 'AddChatRolloutFreeCreditGrant1802000000000'
    breaking = false
    release = '0.85.5'

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_rollout_user" ADD COLUMN IF NOT EXISTS "grantedFreeCreditAt" TIMESTAMP WITH TIME ZONE`)
        await queryRunner.query(`UPDATE "ai_provider" SET "enabledForChat" = true WHERE "provider" = 'ACTIVEPIECES' AND ("enabledForChat" IS NULL OR "enabledForChat" = false)`)
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_rollout_user" DROP COLUMN IF EXISTS "grantedFreeCreditAt"`)
    }
}
