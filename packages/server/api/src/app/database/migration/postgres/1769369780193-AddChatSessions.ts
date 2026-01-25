import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChatSessions1769369780193 implements MigrationInterface {
    name = 'AddChatSessions1769369780193'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "chat_session" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "userId" character varying(21) NOT NULL,
                "conversation" jsonb NOT NULL,
                "modelId" character varying NOT NULL,
                "tools" jsonb NOT NULL,
                CONSTRAINT "PK_9017c2ee500cd1ba895752a0aa7" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_cell_record_id" ON "cell" ("recordId")
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_session"
            ADD CONSTRAINT "fk_chat_session_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_session" DROP CONSTRAINT "fk_chat_session_user"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_cell_record_id"
        `);
        await queryRunner.query(`
            DROP TABLE "chat_session"
        `);
    }

}
