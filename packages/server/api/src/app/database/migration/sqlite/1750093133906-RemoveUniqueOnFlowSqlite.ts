import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveUniqueOnFlowSqlite1750093133906 implements MigrationInterface {
    name = 'RemoveUniqueOnFlowSqlite1750093133906'

    public async up(queryRunner: QueryRunner): Promise<void> {
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
                "status" varchar CHECK(
                    "status" IN ('RESOLVED', 'UNRESOLVED', 'ARCHIVED')
                ) NOT NULL,
                "stepName" varchar,
                "lastOccurrence" datetime NOT NULL,
                CONSTRAINT "REL_6c7309a7ac3112d264f5d7b49f" UNIQUE ("flowId"),
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
                    "stepName",
                    "lastOccurrence"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "flowId",
                "status",
                "stepName",
                "lastOccurrence"
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
                "status" varchar CHECK(
                    "status" IN ('RESOLVED', 'UNRESOLVED', 'ARCHIVED')
                ) NOT NULL,
                "stepName" varchar,
                "lastOccurrence" datetime NOT NULL,
                CONSTRAINT "REL_6c7309a7ac3112d264f5d7b49f" UNIQUE ("flowId")
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
                    "stepName",
                    "lastOccurrence"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "flowId",
                "status",
                "stepName",
                "lastOccurrence"
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
                "status" varchar CHECK(
                    "status" IN ('RESOLVED', 'UNRESOLVED', 'ARCHIVED')
                ) NOT NULL,
                "stepName" varchar,
                "lastOccurrence" datetime NOT NULL,
                CONSTRAINT "REL_6c7309a7ac3112d264f5d7b49f" UNIQUE ("flowId")
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
                    "stepName",
                    "lastOccurrence"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "flowId",
                "status",
                "stepName",
                "lastOccurrence"
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
                "status" varchar CHECK(
                    "status" IN ('RESOLVED', 'UNRESOLVED', 'ARCHIVED')
                ) NOT NULL,
                "stepName" varchar,
                "lastOccurrence" datetime NOT NULL,
                CONSTRAINT "REL_6c7309a7ac3112d264f5d7b49f" UNIQUE ("flowId"),
                CONSTRAINT "fk_issue_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_issue_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE RESTRICT
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
                    "stepName",
                    "lastOccurrence"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "flowId",
                "status",
                "stepName",
                "lastOccurrence"
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
                "status" varchar CHECK(
                    "status" IN ('RESOLVED', 'UNRESOLVED', 'ARCHIVED')
                ) NOT NULL,
                "stepName" varchar,
                "lastOccurrence" datetime NOT NULL,
                CONSTRAINT "REL_6c7309a7ac3112d264f5d7b49f" UNIQUE ("flowId")
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
                    "stepName",
                    "lastOccurrence"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "flowId",
                "status",
                "stepName",
                "lastOccurrence"
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
                "status" varchar CHECK(
                    "status" IN ('RESOLVED', 'UNRESOLVED', 'ARCHIVED')
                ) NOT NULL,
                "stepName" varchar,
                "lastOccurrence" datetime NOT NULL,
                CONSTRAINT "REL_6c7309a7ac3112d264f5d7b49f" UNIQUE ("flowId")
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
                    "stepName",
                    "lastOccurrence"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "flowId",
                "status",
                "stepName",
                "lastOccurrence"
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
                "status" varchar CHECK(
                    "status" IN ('RESOLVED', 'UNRESOLVED', 'ARCHIVED')
                ) NOT NULL,
                "stepName" varchar,
                "lastOccurrence" datetime NOT NULL,
                CONSTRAINT "REL_6c7309a7ac3112d264f5d7b49f" UNIQUE ("flowId"),
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
                    "stepName",
                    "lastOccurrence"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "flowId",
                "status",
                "stepName",
                "lastOccurrence"
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
                "status" varchar CHECK(
                    "status" IN ('RESOLVED', 'UNRESOLVED', 'ARCHIVED')
                ) NOT NULL,
                "stepName" varchar,
                "lastOccurrence" datetime NOT NULL,
                CONSTRAINT "REL_6c7309a7ac3112d264f5d7b49f" UNIQUE ("flowId"),
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
                    "stepName",
                    "lastOccurrence"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "flowId",
                "status",
                "stepName",
                "lastOccurrence"
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
