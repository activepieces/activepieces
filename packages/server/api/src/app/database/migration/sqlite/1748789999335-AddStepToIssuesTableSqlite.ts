import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddStepToIssuesTableSQLite1748789999335 implements MigrationInterface {
    name = 'AddStepToIssuesTableSQLite1748789999335'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "temporary_issue" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "status" varchar CHECK("status" IN ('ONGOING', 'RESOLEVED')) NOT NULL,
                "count" integer NOT NULL,
                "stepId" varchar(21),
                "lastOccurrence" datetime NOT NULL,
                CONSTRAINT "REL_6c7309a7ac3112d264f5d7b49f" UNIQUE ("flowId", "stepId"),
                CONSTRAINT "fk_issue_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_issue_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE RESTRICT
            )
        `)
        
        await queryRunner.query(`
            INSERT INTO "temporary_issue" (
                "id",
                "created",
                "updated",
                "projectId",
                "flowId",
                "status",
                "count",
                "stepId",
                "lastOccurrence"
            )
            SELECT 
                "id",
                "created",
                "updated",
                "projectId",
                "flowId",
                "status",
                "count",
                NULL,
                "lastOccurrence"
            FROM "issue"
        `)
        
        await queryRunner.query('DROP TABLE "issue"')
        
        await queryRunner.query('ALTER TABLE "temporary_issue" RENAME TO "issue"')

        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_issue_flow_id" ON "issue" ("flowId", "stepId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_issue_project_id_flow_id" ON "issue" ("projectId", "flowId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX "idx_issue_project_id_flow_id"')
        await queryRunner.query('DROP INDEX "idx_issue_flow_id"')
        
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
            INSERT INTO "temporary_issue" (
                "id",
                "created",
                "updated",
                "projectId",
                "flowId",
                "status",
                "count",
                "lastOccurrence"
            )
            SELECT 
                "id",
                "created",
                "updated",
                "projectId",
                "flowId",
                "status",
                0,
                "lastOccurrence"
            FROM "issue"
        `)
        
        await queryRunner.query('DROP TABLE "issue"')
        
        await queryRunner.query('ALTER TABLE "temporary_issue" RENAME TO "issue"')

        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_issue_flow_id" ON "issue" ("flowId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_issue_project_id_flow_id" ON "issue" ("projectId", "flowId")
        `)
    }
}
