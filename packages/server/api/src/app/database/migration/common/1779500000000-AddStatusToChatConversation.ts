import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddStatusToChatConversation1779500000000 implements Migration {
    name = 'AddStatusToChatConversation1779500000000'
    breaking = false
    release = '0.83.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_conversation" ADD COLUMN IF NOT EXISTS "status" varchar(20) NOT NULL DEFAULT 'IDLE'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_conversation" DROP COLUMN IF EXISTS "status"
        `)
    }

}
