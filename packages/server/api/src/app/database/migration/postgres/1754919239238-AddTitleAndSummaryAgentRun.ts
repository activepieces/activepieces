import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTitleAndSummaryAgentRun1754919239238 implements MigrationInterface {
    name = 'AddTitleAndSummaryAgentRun1754919239238'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "agent_run"
            ADD "title" character varying
        `);
        await queryRunner.query(`
            ALTER TABLE "agent_run"
            ADD "summary" character varying
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "agent_run" DROP COLUMN "summary"
        `);
        await queryRunner.query(`
            ALTER TABLE "agent_run" DROP COLUMN "title"
        `);
    }

}
