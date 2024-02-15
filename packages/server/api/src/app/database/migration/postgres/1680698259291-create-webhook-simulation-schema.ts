import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateWebhookSimulationSchema1680698259291
implements MigrationInterface {
    name = 'CreateWebhookSimulationSchema1680698259291'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'CREATE TABLE "webhook_simulation" ("id" character varying(21) NOT NULL, "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "flowId" character varying(21) NOT NULL, "projectId" character varying(21) NOT NULL, CONSTRAINT "PK_6854a1ac9a5b24810b29aaf0f43" PRIMARY KEY ("id"))',
        )
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_webhook_simulation_flow_id" ON "webhook_simulation" ("flowId") ',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'DROP INDEX "public"."idx_webhook_simulation_flow_id"',
        )
        await queryRunner.query('DROP TABLE "webhook_simulation"')
    }
}
