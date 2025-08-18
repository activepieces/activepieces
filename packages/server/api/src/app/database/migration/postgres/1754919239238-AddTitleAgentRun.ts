import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTitleAgentRun1754919239238 implements MigrationInterface {
    name = 'AddTitleAgentRun1754919239238'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "agent_run"
            ADD "title" character varying
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "agent_run" DROP COLUMN "title"
        `)
    }

}
