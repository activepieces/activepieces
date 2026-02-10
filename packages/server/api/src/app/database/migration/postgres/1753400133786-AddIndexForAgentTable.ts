import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddIndexForAgentTable1753400133786 implements MigrationInterface {
    name = 'AddIndexForAgentTable1753400133786'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX "idx_agent_run_project_agent_starttime" ON "agent_run" ("projectId", "agentId", "startTime")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_agent_run_project_agent_starttime"
        `)
    }

}
