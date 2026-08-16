import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

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
                "projectId" character varying(21) NOT NULL,
                "ownerId" character varying(21) NOT NULL,
                "externalId" character varying NOT NULL,
                "displayName" character varying NOT NULL,
                "description" character varying,
                "icon" character varying NOT NULL,
                "color" character varying NOT NULL,
                "visibility" character varying NOT NULL,
                "sharedWithUserIds" character varying array NOT NULL DEFAULT '{}',
                "draft" jsonb NOT NULL,
                "published" jsonb,
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
            ADD CONSTRAINT "fk_agent_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)

        await queryRunner.query(`
            ALTER TABLE "agent"
            ADD CONSTRAINT "fk_agent_owner_id" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS "agent" CASCADE')
    }
}
