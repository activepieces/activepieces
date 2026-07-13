import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddCelebrationSceneToReferralPhrase1818000000000 implements Migration {
    name = 'AddCelebrationSceneToReferralPhrase1818000000000'
    breaking = false
    release = '0.85.5'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "referral_phrase" ADD COLUMN "celebrationScene" jsonb
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "referral_phrase" DROP COLUMN IF EXISTS "celebrationScene"
        `)
    }
}
