import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddIssueEntity1750056987397 implements MigrationInterface {
    name = 'AddIssueEntity1750056987397'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "issue" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "projectId" character varying(21) NOT NULL,
                "flowId" character varying(21) NOT NULL,
                "status" character varying NOT NULL,
                "lastOccurrence" TIMESTAMP WITH TIME ZONE NOT NULL,
                "stepName" character varying,
                CONSTRAINT "REL_6c7309a7ac3112d264f5d7b49f" UNIQUE ("flowId"),
                CONSTRAINT "PK_f80e086c249b9f3f3ff2fd321b7" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_issue_flowId_stepName" ON "issue" ("flowId", "stepName")
        `)
        await queryRunner.query(`
            ALTER TABLE "issue"
            ADD CONSTRAINT "fk_issue_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "issue"
            ADD CONSTRAINT "fk_issue_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE RESTRICT
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "issue" DROP CONSTRAINT "fk_issue_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "issue" DROP CONSTRAINT "fk_issue_flow_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_issue_flowId_stepName"
        `)
        await queryRunner.query(`
            DROP TABLE "issue"
        `)
    }
}
