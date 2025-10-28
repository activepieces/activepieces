import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAgentRunsEntityPostgres1752583341290 implements MigrationInterface {
    name = 'AddAgentRunsEntityPostgres1752583341290'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "agent_run" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "agentId" character varying(21) NOT NULL,
                "projectId" character varying(21) NOT NULL,
                "status" character varying NOT NULL,
                "output" jsonb,
                "steps" jsonb NOT NULL,
                "message" character varying,
                "startTime" TIMESTAMP WITH TIME ZONE NOT NULL,
                "finishTime" TIMESTAMP WITH TIME ZONE,
                "prompt" character varying NOT NULL,
                CONSTRAINT "PK_ea8d80275b57b9913c709094f52" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            ALTER TABLE "agent_run"
            ADD CONSTRAINT "FK_fd5968f224bbef0787a26563dd5" FOREIGN KEY ("agentId") REFERENCES "agent"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "agent_run"
            ADD CONSTRAINT "FK_a2642efaec1c09ebf098411314f" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "agent_run" DROP CONSTRAINT "FK_a2642efaec1c09ebf098411314f"
        `)
        await queryRunner.query(`
            ALTER TABLE "agent_run" DROP CONSTRAINT "FK_fd5968f224bbef0787a26563dd5"
        `)
        await queryRunner.query(`
            DROP TABLE "agent_run"
        `)
    }

}
