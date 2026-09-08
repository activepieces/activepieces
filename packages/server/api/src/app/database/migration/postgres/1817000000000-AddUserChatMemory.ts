import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddUserChatMemory1817000000000 implements Migration {
    name = 'AddUserChatMemory1817000000000'
    breaking = false
    release = '0.86.4'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        // A database that recorded this migration under its previous number, 1796000000000, sees
        // this one as unapplied and runs it again — possibly long after
        // RenameChatTablesToAgent1822000000000 turned user_chat_memory into a compatibility view.
        // Indexing or altering a view fails, so there is nothing to do once the rename has happened.
        const [{ alreadyRenamed }] = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = 'public' AND c.relname = 'user_memory' AND c.relkind = 'r'
            ) AS "alreadyRenamed"
        `)
        if (alreadyRenamed) {
            return
        }
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "user_chat_memory" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying(21) NOT NULL,
                "userId" character varying(21) NOT NULL,
                "instructions" character varying,
                "memories" jsonb NOT NULL DEFAULT '[]',
                CONSTRAINT "PK_user_chat_memory" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_user_chat_memory_platform_user" ON "user_chat_memory" ("platformId", "userId")
        `)
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_chat_memory_platform_id') THEN
                    ALTER TABLE "user_chat_memory"
                    ADD CONSTRAINT "fk_user_chat_memory_platform_id"
                    FOREIGN KEY ("platformId") REFERENCES "platform" ("id")
                    ON DELETE CASCADE ON UPDATE NO ACTION;
                END IF;
            END $$
        `)
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_chat_memory_user_id') THEN
                    ALTER TABLE "user_chat_memory"
                    ADD CONSTRAINT "fk_user_chat_memory_user_id"
                    FOREIGN KEY ("userId") REFERENCES "user" ("id")
                    ON DELETE CASCADE ON UPDATE NO ACTION;
                END IF;
            END $$
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS "user_chat_memory"')
    }
}
