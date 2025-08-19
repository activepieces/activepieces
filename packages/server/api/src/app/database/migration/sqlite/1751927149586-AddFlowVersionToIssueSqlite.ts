import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddFlowVersionToIssueSqlite1751927149586 implements MigrationInterface {
    name = 'AddFlowVersionToIssueSqlite1751927149586'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "issue"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_issue_flowId_stepName"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_issue" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "status" varchar NOT NULL,
                "lastOccurrence" datetime NOT NULL,
                "stepName" varchar NOT NULL,
                "flowVersionId" varchar(21) NOT NULL,
                CONSTRAINT "fk_issue_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE RESTRICT,
                CONSTRAINT "fk_issue_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_issue"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "flowId",
                    "status",
                    "lastOccurrence",
                    "stepName"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "flowId",
                "status",
                "lastOccurrence",
                "stepName"
            FROM "issue"
        `)
        await queryRunner.query(`
            DROP TABLE "issue"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_issue"
                RENAME TO "issue"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_issue_flowId_stepName" ON "issue" ("flowId", "stepName")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_issue_flowId_stepName"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_issue" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "status" varchar NOT NULL,
                "lastOccurrence" datetime NOT NULL,
                "stepName" varchar NOT NULL,
                "flowVersionId" varchar(21) NOT NULL,
                CONSTRAINT "fk_issue_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE RESTRICT,
                CONSTRAINT "fk_issue_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_eba4c662c378687bf44f97b3f1f" FOREIGN KEY ("flowVersionId") REFERENCES "flow_version" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_issue"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "flowId",
                    "status",
                    "lastOccurrence",
                    "stepName",
                    "flowVersionId"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "flowId",
                "status",
                "lastOccurrence",
                "stepName",
                "flowVersionId"
            FROM "issue"
        `)
        await queryRunner.query(`
            DROP TABLE "issue"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_issue"
                RENAME TO "issue"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_issue_flowId_stepName" ON "issue" ("flowId", "stepName")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_issue_flowId_stepName"
        `)
        await queryRunner.query(`
            ALTER TABLE "issue"
                RENAME TO "temporary_issue"
        `)
        await queryRunner.query(`
            CREATE TABLE "issue" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "status" varchar NOT NULL,
                "lastOccurrence" datetime NOT NULL,
                "stepName" varchar NOT NULL,
                "flowVersionId" varchar(21) NOT NULL,
                CONSTRAINT "fk_issue_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE RESTRICT,
                CONSTRAINT "fk_issue_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "issue"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "flowId",
                    "status",
                    "lastOccurrence",
                    "stepName",
                    "flowVersionId"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "flowId",
                "status",
                "lastOccurrence",
                "stepName",
                "flowVersionId"
            FROM "temporary_issue"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_issue"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_issue_flowId_stepName" ON "issue" ("flowId", "stepName")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_issue_flowId_stepName"
        `)
        await queryRunner.query(`
            ALTER TABLE "issue"
                RENAME TO "temporary_issue"
        `)
        await queryRunner.query(`
            CREATE TABLE "issue" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "status" varchar NOT NULL,
                "lastOccurrence" datetime NOT NULL,
                "stepName" varchar NOT NULL,
                CONSTRAINT "fk_issue_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE RESTRICT,
                CONSTRAINT "fk_issue_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "issue"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "flowId",
                    "status",
                    "lastOccurrence",
                    "stepName"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "flowId",
                "status",
                "lastOccurrence",
                "stepName"
            FROM "temporary_issue"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_issue"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_issue_flowId_stepName" ON "issue" ("flowId", "stepName")
        `)
    }

}
