import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddChatTables1776200000000 implements Migration {
    name = 'AddChatTables1776200000000'
    breaking = false
    release = '0.83.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "chat_conversation" (
                "id" character varying(21) NOT NULL,
                "created" timestamp with time zone NOT NULL DEFAULT now(),
                "updated" timestamp with time zone NOT NULL DEFAULT now(),
                "projectId" character varying(21) NOT NULL,
                "userId" character varying(21) NOT NULL,
                "title" character varying,
                "sandboxSessionId" character varying,
                "modelName" character varying,
                "totalInputTokens" integer NOT NULL DEFAULT 0,
                "totalOutputTokens" integer NOT NULL DEFAULT 0,
                "summary" text,
                CONSTRAINT "pk_chat_conversation" PRIMARY KEY ("id"),
                CONSTRAINT "fk_chat_conversation_project_id" FOREIGN KEY ("projectId")
                    REFERENCES "project" ("id") ON DELETE CASCADE,
                CONSTRAINT "fk_chat_conversation_user_id" FOREIGN KEY ("userId")
                    REFERENCES "user" ("id") ON DELETE CASCADE
            )
        `)

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_chat_conversation_project_user_created_id"
            ON "chat_conversation" ("projectId", "userId", "created" DESC, "id" DESC)
        `)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "sandbox_sessions" (
                "id" character varying NOT NULL,
                "agent" character varying NOT NULL,
                "agent_session_id" character varying NOT NULL,
                "last_connection_id" character varying NOT NULL,
                "created_at" bigint NOT NULL,
                "destroyed_at" bigint,
                "sandbox_id" character varying,
                "session_init_json" jsonb,
                "config_options_json" jsonb,
                "modes_json" jsonb,
                CONSTRAINT "pk_sandbox_sessions" PRIMARY KEY ("id")
            )
        `)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "sandbox_events" (
                "id" character varying NOT NULL,
                "event_index" bigint NOT NULL,
                "session_id" character varying NOT NULL,
                "created_at" bigint NOT NULL,
                "connection_id" character varying NOT NULL,
                "sender" character varying NOT NULL,
                "payload_json" jsonb NOT NULL,
                CONSTRAINT "pk_sandbox_events" PRIMARY KEY ("id")
            )
        `)

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_sandbox_events_session_order"
            ON "sandbox_events" ("session_id", "event_index", "id")
        `)

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_sandbox_sessions_created_at"
            ON "sandbox_sessions" ("created_at")
        `)

        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD COLUMN IF NOT EXISTS "chatEnabled" boolean
        `)
        await queryRunner.query(`
            UPDATE "platform_plan"
            SET "chatEnabled" = false
            WHERE "chatEnabled" IS NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "chatEnabled"
            SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS "sandbox_events"')
        await queryRunner.query('DROP TABLE IF EXISTS "sandbox_sessions"')
        await queryRunner.query('DROP TABLE IF EXISTS "chat_conversation"')
        await queryRunner.query('ALTER TABLE "platform_plan" DROP COLUMN IF EXISTS "chatEnabled"')
    }
}
