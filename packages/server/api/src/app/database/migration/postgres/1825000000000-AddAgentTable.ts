import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

// The 2025 agents module left `agent` and `agent_run` behind: every entity, service and controller
// that read them was deleted, but no migration ever dropped the tables, so upgraded databases still
// carry them. CASCADE clears the FK constraints that todo, todo_activity, mcp and table once pointed
// at `agent` — those columns are gone from every live entity, and `flow_version.agentIds` is a plain
// string array with no constraint, so nothing readable depends on either table.
export class AddAgentTable1825000000000 implements Migration {
    name = 'AddAgentTable1825000000000'
    breaking = true
    release = '0.88.1'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS "agent_run" CASCADE')
        await queryRunner.query('DROP TABLE IF EXISTS "agent" CASCADE')

        await queryRunner.query(`
            CREATE TABLE "agent" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying(21) NOT NULL,
                "projectId" character varying(21) NOT NULL,
                "externalId" character varying NOT NULL,
                "displayName" character varying NOT NULL,
                "description" character varying,
                "icon" character varying NOT NULL,
                "color" character varying NOT NULL,
                "draft" jsonb NOT NULL,
                "published" jsonb,
                "publishedAt" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "pk_agent" PRIMARY KEY ("id")
            )
        `)

        await queryRunner.query(`
            CREATE INDEX "idx_agent_project_created_id" ON "agent" ("projectId", "created", "id")
        `)

        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_agent_project_external_id" ON "agent" ("projectId", "externalId")
        `)

        await queryRunner.query(`
            ALTER TABLE "agent"
            ADD CONSTRAINT "fk_agent_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)

        await queryRunner.query(`
            ALTER TABLE "agent"
            ADD CONSTRAINT "fk_agent_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS "agent" CASCADE')
    }
}
