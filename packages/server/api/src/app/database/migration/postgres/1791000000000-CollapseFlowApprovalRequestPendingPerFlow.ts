import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class CollapseFlowApprovalRequestPendingPerFlow1791000000000 implements Migration {
    name = 'CollapseFlowApprovalRequestPendingPerFlow1791000000000'
    breaking = false
    release = '0.84.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "flow_approval_request" far_outer
            WHERE far_outer."state" = 'PENDING'
              AND EXISTS (
                SELECT 1
                FROM "flow_approval_request" far_inner
                WHERE far_inner."flowId" = far_outer."flowId"
                  AND far_inner."state" = 'PENDING'
                  AND (
                    far_inner."submittedAt" > far_outer."submittedAt"
                    OR (
                        far_inner."submittedAt" = far_outer."submittedAt"
                        AND far_inner."id" > far_outer."id"
                    )
                  )
              )
        `)

        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_flow_approval_request_flow_version_id"
        `)

        await queryRunner.query(`
            CREATE INDEX "idx_flow_approval_request_flow_version_id"
            ON "flow_approval_request" ("flowVersionId")
        `)

        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_flow_approval_request_flow_id_pending"
            ON "flow_approval_request" ("flowId")
            WHERE "state" = 'PENDING'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_flow_approval_request_flow_id_pending"
        `)

        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_flow_approval_request_flow_version_id"
        `)

        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_flow_approval_request_flow_version_id"
            ON "flow_approval_request" ("flowVersionId")
        `)
    }
}
