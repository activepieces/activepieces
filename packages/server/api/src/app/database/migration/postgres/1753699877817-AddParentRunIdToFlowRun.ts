import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddParentRunIdToFlowRun1753699877817 implements MigrationInterface {
    name = 'AddParentRunIdToFlowRun1753699877817'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD COLUMN IF NOT EXISTS "parentRunId" character varying(21),
            ADD COLUMN IF NOT EXISTS "failParentOnFailure" boolean NOT NULL DEFAULT true
        `)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_run_parent_run_id" ON "flow_run" ("parentRunId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_run_parent_run_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP COLUMN "parentRunId", DROP COLUMN "failParentOnFailure"
        `)
    }

}
