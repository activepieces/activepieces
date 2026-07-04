import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddChatCompactionColumns1786000000000 implements Migration {
    name = 'AddChatCompactionColumns1786000000000'
    breaking = false
    release = '0.85.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_conversation"
            ADD COLUMN "summary" text,
            ADD COLUMN "summarizedUpToIndex" integer
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_conversation"
            DROP COLUMN IF EXISTS "summary",
            DROP COLUMN IF EXISTS "summarizedUpToIndex"
        `)
    }
}
