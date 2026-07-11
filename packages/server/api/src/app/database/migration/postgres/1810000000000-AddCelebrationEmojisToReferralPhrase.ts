import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddCelebrationEmojisToReferralPhrase1810000000000 implements Migration {
    name = 'AddCelebrationEmojisToReferralPhrase1810000000000'
    breaking = false
    release = '0.85.5'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "referral_phrase" ADD COLUMN "celebrationEmojis" jsonb
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "referral_phrase" DROP COLUMN IF EXISTS "celebrationEmojis"
        `)
    }
}
