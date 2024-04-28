import { logger } from "@activepieces/server-shared";
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIssueEntitySqlite1714255928781 implements MigrationInterface {
    name = 'AddIssueEntitySqlite1714255928781'

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info({ name: 'AddIssueEntitySqlite1714255928781' }, 'up');
        await queryRunner.query(`
            CREATE TABLE "issue" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "status" varchar CHECK("status" IN ('ONGOING', 'RESOLEVED')) NOT NULL,
                "count" integer NOT NULL,
                "lastSeen" datetime NOT NULL,
                CONSTRAINT "REL_6c7309a7ac3112d264f5d7b49f" UNIQUE ("flowId"),
                CONSTRAINT "fk_issue_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_issue_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE RESTRICT
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_issue_flow_id" ON "issue" ("flowId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_issue_project_id_flow_id" ON "issue" ("projectId", "flowId")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_issue_project_id_flow_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_issue_flow_id"
        `);
        await queryRunner.query(`
            DROP TABLE "issue"
        `);
    }

}
