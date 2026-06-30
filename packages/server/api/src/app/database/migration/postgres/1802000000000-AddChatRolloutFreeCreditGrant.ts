import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddChatRolloutFreeCreditGrant1802000000000 implements MigrationInterface {
    name = 'AddChatRolloutFreeCreditGrant1802000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_rollout_user"
            ADD COLUMN "grantedFreeCreditAt" TIMESTAMP WITH TIME ZONE
        `)

        // Backfill: existing ACTIVEPIECES providers without a chat provider get enabledForChat
        // Only affects providers with no currently-enabled chat provider on the platform
        await queryRunner.query(`
            UPDATE "ai_provider" ap
            SET "enabledForChat" = true
            WHERE ap."provider" = 'ACTIVEPIECES'
            AND NOT EXISTS (
                SELECT 1 FROM "ai_provider" ap2
                WHERE ap2."platformId" = ap."platformId"
                AND ap2."enabledForChat" = true
                AND ap2."id" != ap."id"
            )
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_rollout_user"
            DROP COLUMN "grantedFreeCreditAt"
        `)

        // Revert: reset enabledForChat on ACTIVEPIECES providers
        await queryRunner.query(`
            UPDATE "ai_provider"
            SET "enabledForChat" = false
            WHERE "provider" = 'ACTIVEPIECES'
        `)
    }
}
