import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUiMessagesToChatConversation1760500000000 implements MigrationInterface {
    name = 'AddUiMessagesToChatConversation1760500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_conversation" ADD COLUMN "uiMessages" jsonb
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_conversation" DROP COLUMN "uiMessages"
        `)
    }

}
