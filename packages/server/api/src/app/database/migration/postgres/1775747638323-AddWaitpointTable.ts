import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddWaitpointTable1775747638323 implements Migration {
    name = 'AddWaitpointTable1775747638323'
    breaking = false
    release = '0.82.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "waitpoint" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "flowRunId" character varying(21) NOT NULL,
                "projectId" character varying(21) NOT NULL,
                "type" character varying NOT NULL,
                "status" character varying NOT NULL,
                "version" character varying NOT NULL DEFAULT 'V0',
                "stepName" character varying NOT NULL DEFAULT '',
                "resumeDateTime" TIMESTAMP WITH TIME ZONE,
                "timeoutSeconds" integer,
                "responseToSend" jsonb,
                "workerHandlerId" character varying,
                "httpRequestId" character varying,
                "resumePayload" jsonb,
                CONSTRAINT "PK_waitpoint" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_waitpoint_flow_run_id_step_name" ON "waitpoint" ("flowRunId", "stepName")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_waitpoint_project_id" ON "waitpoint" ("projectId")
        `)
        await queryRunner.query(`
            ALTER TABLE "waitpoint"
            ADD CONSTRAINT "fk_waitpoint_project_id"
            FOREIGN KEY ("projectId") REFERENCES "project"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "waitpoint" DROP CONSTRAINT "fk_waitpoint_project_id"')
        await queryRunner.query('DROP INDEX "idx_waitpoint_project_id"')
        await queryRunner.query('DROP INDEX "idx_waitpoint_flow_run_id_step_name"')
        await queryRunner.query('DROP TABLE "waitpoint"')
    }
}
