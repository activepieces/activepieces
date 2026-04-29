import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class ReplacesSandboxWithVercelAiSdk1785000000000 implements Migration {
    name = 'ReplacesSandboxWithVercelAiSdk1785000000000'
    breaking = false
    release = '0.84.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_conversation"
            ADD COLUMN IF NOT EXISTS "messages" jsonb NOT NULL DEFAULT '[]'
        `)

        await queryRunner.query(`
            ALTER TABLE "chat_conversation"
            DROP COLUMN IF EXISTS "sandboxSessionId"
        `)

        await queryRunner.query(`
            ALTER TABLE "chat_conversation"
            DROP COLUMN IF EXISTS "summary"
        `)

        await queryRunner.query(`
            ALTER TABLE "ai_provider"
            ADD COLUMN IF NOT EXISTS "enabledForChat" boolean NOT NULL DEFAULT false
        `)

        await queryRunner.query(`
            UPDATE "ai_provider" SET "enabledForChat" = true
            WHERE "provider" = 'activepieces'
        `)

        await queryRunner.query('DROP TABLE IF EXISTS "sandbox_events"')
        await queryRunner.query('DROP TABLE IF EXISTS "sandbox_sessions"')
        await queryRunner.query('DROP TABLE IF EXISTS "user_sandbox"')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_conversation"
            DROP COLUMN IF EXISTS "messages"
        `)

        await queryRunner.query(`
            ALTER TABLE "chat_conversation"
            ADD COLUMN IF NOT EXISTS "sandboxSessionId" character varying
        `)

        await queryRunner.query(`
            ALTER TABLE "chat_conversation"
            ADD COLUMN IF NOT EXISTS "summary" text
        `)

        await queryRunner.query(`
            ALTER TABLE "ai_provider"
            DROP COLUMN IF EXISTS "enabledForChat"
        `)
    }
}
