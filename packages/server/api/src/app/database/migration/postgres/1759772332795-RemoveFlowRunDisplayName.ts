import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveFlowRunDisplayName1759772332795 implements MigrationInterface {
    name = 'RemoveFlowRunDisplayName1759772332795'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP COLUMN "flowDisplayName"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD "flowDisplayName" character varying NOT NULL
        `);
    }

}
