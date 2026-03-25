import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateTableWebhooks1741669458075 implements MigrationInterface {
    name = 'CreateTableWebhooks1741669458075'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_table_project_id_name"
        `)
        await queryRunner.query(`
            CREATE TABLE "table_webhook" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "projectId" character varying(21) NOT NULL,
                "tableId" character varying(21) NOT NULL,
                "events" character varying array NOT NULL,
                "flowId" character varying(21) NOT NULL,
                CONSTRAINT "PK_69093ef390cfa098e6404cc85a8" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_table_project_id_name" ON "table" ("projectId", "name")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_record_project_id_table_id" ON "record" ("projectId", "tableId")
        `)
        await queryRunner.query(`
            ALTER TABLE "table_webhook"
            ADD CONSTRAINT "fk_table_webhook_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "table_webhook"
            ADD CONSTRAINT "fk_table_webhook_table_id" FOREIGN KEY ("tableId") REFERENCES "table"("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
            ALTER TABLE "table_webhook" DROP CONSTRAINT "fk_table_webhook_table_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "table_webhook" DROP CONSTRAINT "fk_table_webhook_project_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_record_project_id_table_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_table_project_id_name"
        `)
        await queryRunner.query(`
            DROP TABLE "table_webhook"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_table_project_id_name" ON "table" ("name", "projectId")
        `)
    }

}
