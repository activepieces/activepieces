import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddChatPersonalization1808000000000 implements Migration {
    name = 'AddChatPersonalization1808000000000'
    breaking = false
    release = '0.85.5'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "chat_personalization" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying(21) NOT NULL,
                "userId" character varying(21),
                "domain" character varying,
                "status" character varying NOT NULL DEFAULT 'PENDING',
                "profile" jsonb,
                "useCases" jsonb,
                CONSTRAINT "PK_chat_personalization" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query('CREATE INDEX "idx_chat_personalization_platform" ON "chat_personalization" ("platformId")')
        // A null userId marks the single platform-wide COMPANY row; partial
        // unique indexes enforce one row per (platform, user) and one company
        // row per platform despite the nullable column.
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_chat_personalization_platform_user"
            ON "chat_personalization" ("platformId", "userId") WHERE "userId" IS NOT NULL
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_chat_personalization_platform_company"
            ON "chat_personalization" ("platformId") WHERE "userId" IS NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "chat_personalization"
            ADD CONSTRAINT "fk_chat_personalization_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "chat_personalization"
            ADD CONSTRAINT "fk_chat_personalization_user_id" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS "chat_personalization"')
    }
}
