import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddChatRolloutFreeCreditGrant1802000000000 implements Migration {
    name = 'AddChatRolloutFreeCreditGrant1802000000000'
    breaking = false
    release = '0.85.4'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_rollout_user"
            ADD COLUMN "grantedFreeCreditAt" TIMESTAMP WITH TIME ZONE
        `)

        // Backfill enabledForChat = true on existing ACTIVEPIECES ai_provider rows
        // that were created before the column default was added, so existing free-tier
        // platforms see the Activepieces provider as available for chat.
        await queryRunner.query(`
            UPDATE "ai_provider"
            SET "enabledForChat" = true
            WHERE "provider" = 'ACTIVEPIECES' AND ("enabledForChat" IS NULL OR "enabledForChat" = false)
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_rollout_user" DROP COLUMN "grantedFreeCreditAt"
        `)
    }
}
