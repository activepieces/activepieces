import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddChatTables1776000000000 implements Migration {
    name = 'AddChatTables1776000000000'
    breaking = false
    release = '0.83.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "chat_conversation" (
                "id" character varying(21) NOT NULL,
                "created" timestamp with time zone NOT NULL DEFAULT now(),
                "updated" timestamp with time zone NOT NULL DEFAULT now(),
                "projectId" character varying(21) NOT NULL,
                "userId" character varying(21) NOT NULL,
                "title" character varying,
                "modelProvider" character varying,
                "modelName" character varying,
                CONSTRAINT "pk_chat_conversation" PRIMARY KEY ("id"),
                CONSTRAINT "fk_chat_conversation_project_id" FOREIGN KEY ("projectId")
                    REFERENCES "project" ("id") ON DELETE CASCADE,
                CONSTRAINT "fk_chat_conversation_user_id" FOREIGN KEY ("userId")
                    REFERENCES "user" ("id") ON DELETE CASCADE
            )
        `)

        await queryRunner.query(`
            CREATE INDEX "idx_chat_conversation_project_user_created"
            ON "chat_conversation" ("projectId", "userId", "created" DESC)
        `)

        await queryRunner.query(`
            CREATE TABLE "chat_message" (
                "id" character varying(21) NOT NULL,
                "created" timestamp with time zone NOT NULL DEFAULT now(),
                "updated" timestamp with time zone NOT NULL DEFAULT now(),
                "conversationId" character varying(21) NOT NULL,
                "role" character varying NOT NULL,
                "content" text NOT NULL,
                "toolCalls" jsonb,
                "fileUrls" text[],
                "tokenUsage" jsonb,
                CONSTRAINT "pk_chat_message" PRIMARY KEY ("id"),
                CONSTRAINT "fk_chat_message_conversation_id" FOREIGN KEY ("conversationId")
                    REFERENCES "chat_conversation" ("id") ON DELETE CASCADE
            )
        `)

        await queryRunner.query(`
            CREATE INDEX "idx_chat_message_conversation_created"
            ON "chat_message" ("conversationId", "created")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS "chat_message"')
        await queryRunner.query('DROP TABLE IF EXISTS "chat_conversation"')
    }
}
