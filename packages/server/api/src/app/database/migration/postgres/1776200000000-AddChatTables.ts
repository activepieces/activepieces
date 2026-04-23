import { ApEdition } from '@activepieces/shared'
import { QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'
import { Migration } from '../../migration'

export class AddChatTables1776200000000 implements Migration {
    name = 'AddChatTables1776200000000'
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
            CREATE INDEX "idx_chat_conversation_project_user_created"
            ON "chat_conversation" ("projectId", "userId", "created" DESC)
        `)

        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }

        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "chatEnabled" boolean
        `)
        await queryRunner.query(`
            UPDATE "platform_plan"
            SET "chatEnabled" = false
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "chatEnabled"
            SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS "chat_conversation"')

        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query('ALTER TABLE "platform_plan" DROP COLUMN "chatEnabled"')
    }
}
