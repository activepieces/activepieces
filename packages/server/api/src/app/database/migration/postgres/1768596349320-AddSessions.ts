import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSessions1768596349320 implements MigrationInterface {
    name = 'AddSessions1768596349320'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "chat_session" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "userId" character varying(21) NOT NULL,
                "plan" jsonb,
                "conversation" jsonb NOT NULL,
                CONSTRAINT "PK_9017c2ee500cd1ba895752a0aa7" PRIMARY KEY ("id")
            )
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
            DROP TABLE "chat_session"
        `);
    }

}
