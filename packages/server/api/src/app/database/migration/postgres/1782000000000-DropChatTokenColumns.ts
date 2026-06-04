import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class DropChatTokenColumns1782000000000 implements Migration {
    name = 'DropChatTokenColumns1782000000000'
    breaking = false
    release = '0.83.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_conversation"
            DROP COLUMN IF EXISTS "totalInputTokens",
            DROP COLUMN IF EXISTS "totalOutputTokens"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_conversation"
            ADD COLUMN "totalInputTokens" integer NOT NULL DEFAULT 0,
            ADD COLUMN "totalOutputTokens" integer NOT NULL DEFAULT 0
        `)
    }
}
