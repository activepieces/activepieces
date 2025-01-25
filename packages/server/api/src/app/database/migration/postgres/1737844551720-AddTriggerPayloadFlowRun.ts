import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTriggerPayloadFlowRun1737844551720 implements MigrationInterface {
    name = 'AddTriggerPayloadFlowRun1737844551720'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD "triggerPayloadFileId" character varying(21)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP COLUMN "triggerPayloadFileId"
        `);
    }

}
