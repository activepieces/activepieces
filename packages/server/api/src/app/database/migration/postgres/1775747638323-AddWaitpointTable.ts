import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddWaitpointTable1775747638323 implements Migration {
    name = 'AddWaitpointTable1775747638323'
    breaking = true
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
        await this.migrateExistingPausedRuns(queryRunner)

        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP COLUMN IF EXISTS "pauseMetadata"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run" ADD "pauseMetadata" jsonb
        `)

        await this.restorePauseMetadata(queryRunner)

        await queryRunner.query('ALTER TABLE "waitpoint" DROP CONSTRAINT "fk_waitpoint_project_id"')
        await queryRunner.query('DROP INDEX "idx_waitpoint_project_id"')
        await queryRunner.query('DROP INDEX "idx_waitpoint_flow_run_id_step_name"')
        await queryRunner.query('DROP TABLE "waitpoint"')
    }

    private async migrateExistingPausedRuns(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "waitpoint" (
                "id", "flowRunId", "projectId", "type", "status", "stepName",
                "resumeDateTime", "responseToSend", "workerHandlerId", "httpRequestId"
            )
            SELECT
                substr(md5(random()::text), 1, 21),
                fr.id,
                fr."projectId",
                CASE WHEN (fr."pauseMetadata"->>'type') = 'DELAY' THEN 'DELAY' ELSE 'WEBHOOK' END,
                'PENDING',
                '',
                (fr."pauseMetadata"->>'resumeDateTime')::timestamptz,
                fr."pauseMetadata"->'response',
                fr."pauseMetadata"->>'handlerId',
                fr."pauseMetadata"->>'requestIdToReply'
            FROM flow_run fr
            WHERE fr.status IN ('PAUSED', 'RUNNING')
              AND fr."pauseMetadata" IS NOT NULL
            ON CONFLICT ("flowRunId", "stepName") DO NOTHING
        `)
    }

    private async restorePauseMetadata(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "flow_run" fr
            SET "pauseMetadata" = CASE
                WHEN w."type" = 'DELAY' THEN jsonb_build_object(
                    'type', 'DELAY',
                    'resumeDateTime', w."resumeDateTime",
                    'handlerId', w."workerHandlerId",
                    'requestIdToReply', w."httpRequestId"
                )
                ELSE jsonb_build_object(
                    'type', 'WEBHOOK',
                    'requestId', substr(md5(random()::text), 1, 21),
                    'response', COALESCE(w."responseToSend", '{}'::jsonb),
                    'handlerId', w."workerHandlerId",
                    'requestIdToReply', w."httpRequestId"
                )
            END
            FROM "waitpoint" w
            WHERE w."flowRunId" = fr.id
              AND w.status = 'PENDING'
        `)
    }
}
