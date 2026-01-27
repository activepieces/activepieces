import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChatConversation1769537880214 implements MigrationInterface {
    name = 'AddChatConversation1769537880214'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "chat_conversation" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "title" character varying NOT NULL,
                "sessionId" character varying(21) NOT NULL,
                "conversation" jsonb NOT NULL,
                CONSTRAINT "PK_0c5b7697e69f674eb983b1e83cc" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_session" DROP COLUMN "conversation"
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_conversation"
            ADD CONSTRAINT "fk_chat_conversation_session" FOREIGN KEY ("sessionId") REFERENCES "chat_session"("id") ON DELETE CASCADE ON UPDATE RESTRICT
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_conversation" DROP CONSTRAINT "fk_chat_conversation_session"
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_session"
            ADD "conversation" jsonb NOT NULL
        `);
        await queryRunner.query(`
            DROP TABLE "chat_conversation"
        `);
    }

}
