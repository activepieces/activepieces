import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddStepToIssuesTableSQLite1748789999335 implements MigrationInterface {
    name = 'AddStepToIssuesTableSQLite1748789999335'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create temporary table with new structure
        await queryRunner.query(`
            CREATE TABLE "temporary_issue" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "status" varchar CHECK("status" IN ('ONGOING', 'RESOLEVED')) NOT NULL,
                "stepName" varchar(21),
                "lastOccurrence" datetime NOT NULL,
                CONSTRAINT "REL_6c7309a7ac3112d264f5d7b49f" UNIQUE ("flowId", "stepName"),
                CONSTRAINT "fk_issue_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_issue_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE RESTRICT
            )
        `)
        
        await queryRunner.query(`
            INSERT INTO "temporary_issue"
            SELECT 
                id, created, updated, projectId, flowId, status, NULL as stepName, lastOccurrence
            FROM "issue"
        `)
        
        await queryRunner.query('DROP TABLE "issue"')
        await queryRunner.query('ALTER TABLE "temporary_issue" RENAME TO "issue"')

        await queryRunner.query(`
            CREATE INDEX "idx_issue_flowId_stepId" ON "issue" ("flowId", "stepName")
        `)

        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD COLUMN "failedStepName" varchar(21)
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_run_flow_failed_step"
            ON "flow_run" ("flowId", "failedStepName")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "temporary_issue" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "status" varchar CHECK("status" IN ('ONGOING', 'RESOLEVED')) NOT NULL,
                "count" integer NOT NULL,
                "lastOccurrence" datetime NOT NULL,
                CONSTRAINT "REL_6c7309a7ac3112d264f5d7b49f" UNIQUE ("flowId"),
                CONSTRAINT "fk_issue_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_issue_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE RESTRICT
            )
        `)
        
        await queryRunner.query(`
            INSERT INTO "temporary_issue"
            SELECT 
                id, created, updated, projectId, flowId, status, 0 as count, lastOccurrence
            FROM "issue"
        `)
        
        await queryRunner.query('DROP TABLE "issue"')
        await queryRunner.query('ALTER TABLE "temporary_issue" RENAME TO "issue"')

        await queryRunner.query(`
            CREATE INDEX "idx_issue_project_id_flow_id" ON "issue" ("projectId", "flowId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_issue_flow_id" ON "issue" ("flowId")
        `)

        await queryRunner.query(`
            DROP INDEX "idx_flow_run_flow_failed_step"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            DROP COLUMN "failedStepName"
        `)
    }
}
