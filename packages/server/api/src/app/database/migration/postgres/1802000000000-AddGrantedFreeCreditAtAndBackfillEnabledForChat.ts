import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddGrantedFreeCreditAtAndBackfillEnabledForChat1802000000000 implements Migration {
    name = 'AddGrantedFreeCreditAtAndBackfillEnabledForChat1802000000000'
    breaking = false
    release = '0.85.4'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_rollout_user"
            ADD COLUMN "grantedFreeCreditAt" TIMESTAMP WITH TIME ZONE
        `)
        await queryRunner.query(`
            UPDATE "ai_provider"
            SET "enabledForChat" = true
            WHERE "provider" = 'ACTIVEPIECES'
            AND "enabledForChat" IS DISTINCT FROM true
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_rollout_user"
            DROP COLUMN "grantedFreeCreditAt"
        `)
        await queryRunner.query(`
            UPDATE "ai_provider"
            SET "enabledForChat" = false
            WHERE "provider" = 'ACTIVEPIECES'
            AND "enabledForChat" = true
        `)
    }
}
