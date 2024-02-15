import { MigrationInterface, QueryRunner } from 'typeorm'

export class Chatbot1694902537040 implements MigrationInterface {
    name = 'Chatbot1694902537040'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'CREATE TABLE "chatbot" ("id" character varying(21) NOT NULL, "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "type" character varying NOT NULL, "displayName" character varying NOT NULL, "projectId" character varying NOT NULL, "connectionId" character varying, "dataSources" jsonb NOT NULL, "prompt" character varying, CONSTRAINT "PK_1ee1961e62c5cec278314f1d68e" PRIMARY KEY ("id"))',
        )
        await queryRunner.query(
            'ALTER TABLE "chatbot" ADD CONSTRAINT "FK_d2f5f245c27541cd70f13f169eb" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION',
        )
        await queryRunner.query(
            'ALTER TABLE "chatbot" ADD CONSTRAINT "FK_13f7ad52cefa43433864732c384" FOREIGN KEY ("connectionId") REFERENCES "app_connection"("id") ON DELETE NO ACTION ON UPDATE NO ACTION',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "chatbot" DROP CONSTRAINT "FK_13f7ad52cefa43433864732c384"',
        )
        await queryRunner.query(
            'ALTER TABLE "chatbot" DROP CONSTRAINT "FK_d2f5f245c27541cd70f13f169eb"',
        )
        await queryRunner.query('DROP TABLE "chatbot"')
    }
}
