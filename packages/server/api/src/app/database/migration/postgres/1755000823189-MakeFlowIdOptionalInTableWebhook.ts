import { MigrationInterface, QueryRunner } from 'typeorm'

export class MakeFlowIdOptionalInTableWebhook1755000823189 implements MigrationInterface {
    name = 'MakeFlowIdOptionalInTableWebhook1755000823189'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "table_webhook" DROP CONSTRAINT "fk_table_webhook_flow_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "table_webhook"
            ALTER COLUMN "flowId" DROP NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "table_webhook"
            ADD CONSTRAINT "fk_table_webhook_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "table_webhook" DROP CONSTRAINT "fk_table_webhook_flow_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "table_webhook"
            ALTER COLUMN "flowId"
            SET NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "table_webhook"
            ADD CONSTRAINT "fk_table_webhook_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

}
