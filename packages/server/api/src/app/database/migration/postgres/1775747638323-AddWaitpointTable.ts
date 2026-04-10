import { apId } from '@activepieces/shared'
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
            CREATE UNIQUE INDEX "idx_waitpoint_flow_run_id" ON "waitpoint" ("flowRunId")
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
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD COLUMN "waitpointId" character varying(21)
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_run_waitpoint_id" ON "flow_run" ("waitpointId")
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD CONSTRAINT "fk_flow_run_waitpoint_id"
            FOREIGN KEY ("waitpointId") REFERENCES "waitpoint"("id")
            ON DELETE SET NULL ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            UPDATE "flow_run"
            SET "waitpointId" = w.id
            FROM "waitpoint" w
            WHERE w."flowRunId" = "flow_run".id
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "flow_run" DROP CONSTRAINT "fk_flow_run_waitpoint_id"')
        await queryRunner.query('DROP INDEX "idx_run_waitpoint_id"')
        await queryRunner.query('ALTER TABLE "flow_run" DROP COLUMN "waitpointId"')

        await queryRunner.query(`
            ALTER TABLE "flow_run" ADD "pauseMetadata" jsonb
        `)

        await this.restorePauseMetadata(queryRunner)

        await queryRunner.query('ALTER TABLE "waitpoint" DROP CONSTRAINT "fk_waitpoint_project_id"')
        await queryRunner.query('DROP INDEX "idx_waitpoint_project_id"')
        await queryRunner.query('DROP INDEX "idx_waitpoint_flow_run_id"')
        await queryRunner.query('DROP TABLE "waitpoint"')
    }

    private async migrateExistingPausedRuns(queryRunner: QueryRunner): Promise<void> {
        const pausedRuns = await queryRunner.query(`
            SELECT id, "projectId", "pauseMetadata"
            FROM flow_run
            WHERE "pauseMetadata" IS NOT NULL
              AND status IN ('PAUSED', 'RUNNING')
        `)

        for (const run of pausedRuns) {
            const meta = typeof run.pauseMetadata === 'string'
                ? JSON.parse(run.pauseMetadata)
                : run.pauseMetadata

            const type = meta.type === 'DELAY' ? 'DELAY' : 'WEBHOOK'

            await queryRunner.query(`
                INSERT INTO "waitpoint" (
                    "id", "flowRunId", "projectId", "type", "status",
                    "resumeDateTime", "responseToSend", "workerHandlerId", "httpRequestId"
                ) VALUES ($1, $2, $3, $4, 'PENDING', $5, $6, $7, $8)
                ON CONFLICT ("flowRunId") DO NOTHING
            `, [
                apId(),
                run.id,
                run.projectId,
                type,
                meta.resumeDateTime ?? null,
                meta.response ? JSON.stringify(meta.response) : null,
                meta.handlerId ?? null,
                meta.requestIdToReply ?? null,
            ])
        }
    }

    private async restorePauseMetadata(queryRunner: QueryRunner): Promise<void> {
        const waitpoints = await queryRunner.query(`
            SELECT w."flowRunId", w."type", w."resumeDateTime",
                   w."responseToSend", w."workerHandlerId", w."httpRequestId"
            FROM "waitpoint" w
            JOIN "flow_run" fr ON fr.id = w."flowRunId"
            WHERE w.status = 'PENDING'
        `)

        for (const wp of waitpoints) {
            const pauseMetadata = wp.type === 'DELAY'
                ? {
                    type: 'DELAY',
                    resumeDateTime: wp.resumeDateTime,
                    handlerId: wp.workerHandlerId,
                    requestIdToReply: wp.httpRequestId,
                }
                : {
                    type: 'WEBHOOK',
                    requestId: apId(),
                    response: wp.responseToSend ?? {},
                    handlerId: wp.workerHandlerId,
                    requestIdToReply: wp.httpRequestId,
                }

            await queryRunner.query(`
                UPDATE "flow_run" SET "pauseMetadata" = $1 WHERE id = $2
            `, [JSON.stringify(pauseMetadata), wp.flowRunId])
        }
    }
}
