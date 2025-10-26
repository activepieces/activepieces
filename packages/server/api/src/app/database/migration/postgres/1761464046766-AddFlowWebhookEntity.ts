import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFlowWebhookEntity1761464046766 implements MigrationInterface {
    name = 'AddFlowWebhookEntity1761464046766'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "flow_webhook" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "projectId" character varying(21) NOT NULL,
                "targetFlowId" character varying(21) NOT NULL,
                CONSTRAINT "PK_b7fb79943f7cc359a7fa1adf054" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "flow_webhook"
            ADD CONSTRAINT "fk_flow_webhook_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "flow_webhook"
            ADD CONSTRAINT "fk_flow_webhook_flow_id" FOREIGN KEY ("targetFlowId") REFERENCES "flow"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            CREATE TABLE "flow-webhook-trigger-flow" (
                "flow_webhook_id" character varying(21) NOT NULL,
                "flow_id" character varying(21) NOT NULL,
                CONSTRAINT "PK_e806f0a39b598353b9c930bd743" PRIMARY KEY ("flow_webhook_id", "flow_id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_8ee430e57850f891bf63ef7faa" ON "flow-webhook-trigger-flow" ("flow_webhook_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_b13c4b33941b89da9ee704274d" ON "flow-webhook-trigger-flow" ("flow_id")
        `);
        await queryRunner.query(`
            ALTER TABLE "flow-webhook-trigger-flow"
            ADD CONSTRAINT "FK_8ee430e57850f891bf63ef7faa7" FOREIGN KEY ("flow_webhook_id") REFERENCES "flow_webhook"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE "flow-webhook-trigger-flow"
            ADD CONSTRAINT "FK_b13c4b33941b89da9ee704274d6" FOREIGN KEY ("flow_id") REFERENCES "flow"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow-webhook-trigger-flow" DROP CONSTRAINT "FK_b13c4b33941b89da9ee704274d6"
        `);
        await queryRunner.query(`
            ALTER TABLE "flow-webhook-trigger-flow" DROP CONSTRAINT "FK_8ee430e57850f891bf63ef7faa7"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_b13c4b33941b89da9ee704274d"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_8ee430e57850f891bf63ef7faa"
        `);
        await queryRunner.query(`
            DROP TABLE "flow-webhook-trigger-flow"
        `);
        await queryRunner.query(`
            ALTER TABLE "flow_webhook" DROP CONSTRAINT "fk_flow_webhook_flow_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "flow_webhook" DROP CONSTRAINT "fk_flow_webhook_project_id"
        `);
        await queryRunner.query(`
            DROP TABLE "flow_webhook"
        `);
    }

}
