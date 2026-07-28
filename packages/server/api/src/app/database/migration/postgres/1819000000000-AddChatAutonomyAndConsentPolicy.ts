import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddChatAutonomyAndConsentPolicy1819000000000 implements Migration {
    name = 'AddChatAutonomyAndConsentPolicy1819000000000'
    breaking = false
    release = '0.86.3'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_conversation" ADD COLUMN IF NOT EXISTS "autonomyMode" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "platform" ADD COLUMN IF NOT EXISTS "chatConsentPolicy" jsonb
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "chat_conversation" DROP COLUMN IF EXISTS "autonomyMode"')
        await queryRunner.query('ALTER TABLE "platform" DROP COLUMN IF EXISTS "chatConsentPolicy"')
    }
}
