import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddAgentTask1865000000000 implements Migration {
    name = 'AddAgentTask1865000000000'
    breaking = false
    release = '0.93.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "agent_task" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying(21) NOT NULL,
                "projectId" character varying(21),
                "conversationId" character varying(21) NOT NULL,
                "title" character varying NOT NULL,
                "status" character varying NOT NULL,
                "messages" jsonb NOT NULL DEFAULT '[]',
                "summary" character varying,
                "artifacts" jsonb NOT NULL DEFAULT '[]',
                "claimId" character varying(21),
                CONSTRAINT "pk_agent_task" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_agent_task_platform_conversation_created" ON "agent_task" ("platformId", "conversationId", "created")
        `)
        await queryRunner.query(`
            ALTER TABLE "agent_task" ADD CONSTRAINT "fk_agent_task_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "agent_task" ADD CONSTRAINT "fk_agent_task_conversation_id" FOREIGN KEY ("conversationId") REFERENCES "agent_conversation"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE IF EXISTS "agent_task"
        `)
    }
}
