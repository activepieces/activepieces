import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddChatPersonalization1831000000000 implements Migration {
    name = 'AddChatPersonalization1831000000000'
    breaking = false
    release = '0.88.2'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "chat_personalization" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying(21) NOT NULL,
                "userId" character varying(21),
                "domain" character varying,
                "companyText" character varying,
                "role" character varying,
                "status" character varying NOT NULL DEFAULT 'PENDING',
                "researchToken" character varying(21),
                "profile" jsonb,
                "useCases" jsonb,
                CONSTRAINT "pk_chat_personalization" PRIMARY KEY ("id")
            )
        `)

        await queryRunner.query(`
            CREATE INDEX "idx_chat_personalization_platform" ON "chat_personalization" ("platformId")
        `)

        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_chat_personalization_platform_user" ON "chat_personalization" ("platformId", "userId") WHERE "userId" IS NOT NULL
        `)

        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_chat_personalization_platform_company" ON "chat_personalization" ("platformId") WHERE "userId" IS NULL
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
        await queryRunner.query('DROP TABLE IF EXISTS "chat_personalization" CASCADE')
    }
}
