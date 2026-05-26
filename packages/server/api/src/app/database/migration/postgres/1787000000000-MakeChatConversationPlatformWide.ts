import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class MakeChatConversationPlatformWide1787000000000 implements Migration {
    name = 'MakeChatConversationPlatformWide1787000000000'
    breaking = false
    release = '0.82.1'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_conversation"
            ADD COLUMN "platformId" varchar(21)
        `)

        await queryRunner.query(`
            UPDATE "chat_conversation" cc
            SET "platformId" = p."platformId"
            FROM "project" p
            WHERE cc."projectId" = p."id"
        `)

        // Remove conversations with no matching project — they can't be backfilled
        await queryRunner.query(`
            DELETE FROM "chat_conversation"
            WHERE "platformId" IS NULL
        `)

        await queryRunner.query(`
            ALTER TABLE "chat_conversation"
            ALTER COLUMN "platformId" SET NOT NULL
        `)

        await queryRunner.query(`
            ALTER TABLE "chat_conversation"
            ALTER COLUMN "projectId" DROP NOT NULL
        `)

        await queryRunner.query(`
            ALTER TABLE "chat_conversation"
            DROP CONSTRAINT IF EXISTS "fk_chat_conversation_project_id"
        `)

        await queryRunner.query(`
            ALTER TABLE "chat_conversation"
            ADD CONSTRAINT "fk_chat_conversation_project_id"
            FOREIGN KEY ("projectId") REFERENCES "project"("id")
            ON DELETE SET NULL
        `)

        await queryRunner.query(`
            ALTER TABLE "chat_conversation"
            ADD CONSTRAINT "fk_chat_conversation_platform_id"
            FOREIGN KEY ("platformId") REFERENCES "platform"("id")
            ON DELETE CASCADE
        `)

        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_chat_conversation_project_user_created_id"
        `)

        await queryRunner.query(`
            CREATE INDEX "idx_chat_conversation_platform_user_created_id"
            ON "chat_conversation" ("platformId", "userId", "created", "id")
        `)

        // Clear projectId — conversations are now platform-wide by default
        await queryRunner.query(`
            UPDATE "chat_conversation"
            SET "projectId" = NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_chat_conversation_platform_user_created_id"
        `)

        await queryRunner.query(`
            ALTER TABLE "chat_conversation"
            DROP CONSTRAINT IF EXISTS "fk_chat_conversation_platform_id"
        `)

        await queryRunner.query(`
            ALTER TABLE "chat_conversation"
            DROP CONSTRAINT IF EXISTS "fk_chat_conversation_project_id"
        `)

        await queryRunner.query(`
            DELETE FROM "chat_conversation"
            WHERE "projectId" IS NULL
        `)

        await queryRunner.query(`
            ALTER TABLE "chat_conversation"
            ALTER COLUMN "projectId" SET NOT NULL
        `)

        await queryRunner.query(`
            ALTER TABLE "chat_conversation"
            ADD CONSTRAINT "fk_chat_conversation_project_id"
            FOREIGN KEY ("projectId") REFERENCES "project"("id")
            ON DELETE CASCADE
        `)

        await queryRunner.query(`
            CREATE INDEX "idx_chat_conversation_project_user_created_id"
            ON "chat_conversation" ("projectId", "userId", "created", "id")
        `)

        await queryRunner.query(`
            ALTER TABLE "chat_conversation"
            DROP COLUMN "platformId"
        `)
    }
}
