import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddUserChatMemory1796000000000 implements Migration {
    name = 'AddUserChatMemory1796000000000'
    breaking = false
    release = '0.85.2'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "user_chat_memory" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying(21) NOT NULL,
                "userId" character varying(21) NOT NULL,
                "memories" jsonb NOT NULL DEFAULT '[]',
                CONSTRAINT "PK_user_chat_memory" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_chat_memory_platform_user" ON "user_chat_memory" ("platformId", "userId")
        `)
        await queryRunner.query(`
            ALTER TABLE "user_chat_memory"
            ADD CONSTRAINT "fk_user_chat_memory_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "user_chat_memory"
            ADD CONSTRAINT "fk_user_chat_memory_user_id" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS "user_chat_memory"')
    }
}
