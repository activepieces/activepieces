import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddChatRolloutFreeCreditGrant1802000000000 implements Migration {
    name = 'AddChatRolloutFreeCreditGrant1802000000000'
    breaking = false
    release = '0.85.5'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_rollout_user" ADD COLUMN "grantedFreeCreditAt" TIMESTAMP WITH TIME ZONE
        `)
        // Make the managed Activepieces provider the default chat provider so cloud free users
        // skip the "set up a provider" wall. Scoped to platforms that have not already picked a
        // chat provider, so existing BYO selections are preserved.
        await queryRunner.query(`
            UPDATE "ai_provider" SET "enabledForChat" = true
            WHERE "provider" = 'ACTIVEPIECES'
            AND "platformId" NOT IN (
                SELECT "platformId" FROM "ai_provider" WHERE "enabledForChat" = true
            )
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_rollout_user" DROP COLUMN "grantedFreeCreditAt"
        `)
    }
}
