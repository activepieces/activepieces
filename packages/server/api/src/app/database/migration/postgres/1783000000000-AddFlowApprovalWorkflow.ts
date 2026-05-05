import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddFlowApprovalWorkflow1783000000000 implements Migration {
    name = 'AddFlowApprovalWorkflow1783000000000'
    breaking = false
    release = '0.84.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD COLUMN IF NOT EXISTS "sensitive" boolean NOT NULL DEFAULT false
        `)

        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD COLUMN IF NOT EXISTS "flowApprovalEnabled" boolean
        `)
        await queryRunner.query(`
            UPDATE "platform_plan"
            SET "flowApprovalEnabled" = false
            WHERE "flowApprovalEnabled" IS NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "flowApprovalEnabled" SET NOT NULL
        `)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "flow_approval_request" (
                "id" character varying(21) NOT NULL,
                "created" timestamp with time zone NOT NULL DEFAULT now(),
                "updated" timestamp with time zone NOT NULL DEFAULT now(),
                "flowVersionId" character varying(21) NOT NULL,
                "flowId" character varying(21) NOT NULL,
                "projectId" character varying(21) NOT NULL,
                "platformId" character varying(21) NOT NULL,
                "submitterId" character varying(21),
                "submittedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "approverId" character varying(21),
                "decidedAt" timestamp with time zone,
                "state" character varying NOT NULL,
                "requestedStatus" character varying NOT NULL,
                "rejectionReason" text,
                CONSTRAINT "pk_flow_approval_request" PRIMARY KEY ("id"),
                CONSTRAINT "fk_flow_approval_request_flow_version_id" FOREIGN KEY ("flowVersionId")
                    REFERENCES "flow_version" ("id") ON DELETE CASCADE,
                CONSTRAINT "fk_flow_approval_request_flow_id" FOREIGN KEY ("flowId")
                    REFERENCES "flow" ("id") ON DELETE CASCADE,
                CONSTRAINT "fk_flow_approval_request_submitter_id" FOREIGN KEY ("submitterId")
                    REFERENCES "user" ("id") ON DELETE SET NULL,
                CONSTRAINT "fk_flow_approval_request_approver_id" FOREIGN KEY ("approverId")
                    REFERENCES "user" ("id") ON DELETE SET NULL
            )
        `)

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_flow_approval_request_flow_version_id"
            ON "flow_approval_request" ("flowVersionId")
        `)

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_flow_approval_request_project_id_state_created"
            ON "flow_approval_request" ("projectId", "state", "created")
        `)

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_flow_approval_request_flow_id_state"
            ON "flow_approval_request" ("flowId", "state")
        `)

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_flow_approval_request_platform_id_state"
            ON "flow_approval_request" ("platformId", "state")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS "flow_approval_request"')
        await queryRunner.query('ALTER TABLE "platform_plan" DROP COLUMN IF EXISTS "flowApprovalEnabled"')
        await queryRunner.query('ALTER TABLE "project" DROP COLUMN IF EXISTS "sensitive"')
    }
}
