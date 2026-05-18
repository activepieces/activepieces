import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTagsToRunSqlite1692056190942 implements MigrationInterface {
    name = 'AddTagsToRunSqlite1692056190942'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (await migrationRan('AddTagsToRunSqlite31692056190942', queryRunner)) {
            return
        }
        await queryRunner.query(
            'DROP INDEX "idx_run_project_id_flow_id_environment_status_created_desc"',
        )
        await queryRunner.query(
            'DROP INDEX "idx_run_project_id_flow_id_environment_created_desc"',
        )
        await queryRunner.query(
            'DROP INDEX "idx_run_project_id_environment_status_created_desc"',
        )
        await queryRunner.query(
            'DROP INDEX "idx_run_project_id_environment_created_desc"',
        )
        await queryRunner.query(
            'CREATE TABLE "temporary_flow_run" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "projectId" varchar(21) NOT NULL, "flowId" varchar(21) NOT NULL, "flowVersionId" varchar(21) NOT NULL, "environment" varchar, "flowDisplayName" varchar NOT NULL, "logsFileId" varchar(21), "status" varchar NOT NULL, "tasks" integer, "startTime" datetime NOT NULL, "finishTime" datetime, "pauseMetadata" text, "tags" text, CONSTRAINT "fk_flow_run_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "fk_flow_run_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)',
        )
        await queryRunner.query(
            'INSERT INTO "temporary_flow_run"("id", "created", "updated", "projectId", "flowId", "flowVersionId", "environment", "flowDisplayName", "logsFileId", "status", "tasks", "startTime", "finishTime", "pauseMetadata") SELECT "id", "created", "updated", "projectId", "flowId", "flowVersionId", "environment", "flowDisplayName", "logsFileId", "status", "tasks", "startTime", "finishTime", "pauseMetadata" FROM "flow_run"',
        )
        await queryRunner.query('DROP TABLE "flow_run"')
        await queryRunner.query(
            'ALTER TABLE "temporary_flow_run" RENAME TO "flow_run"',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_run_project_id_flow_id_environment_status_created_desc" ON "flow_run" ("projectId", "flowId", "environment", "status", "created") ',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_run_project_id_flow_id_environment_created_desc" ON "flow_run" ("projectId", "flowId", "environment", "created") ',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_run_project_id_environment_status_created_desc" ON "flow_run" ("projectId", "environment", "status", "created") ',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_run_project_id_environment_created_desc" ON "flow_run" ("projectId", "environment", "created") ',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'DROP INDEX "idx_run_project_id_environment_created_desc"',
        )
        await queryRunner.query(
            'DROP INDEX "idx_run_project_id_environment_status_created_desc"',
        )
        await queryRunner.query(
            'DROP INDEX "idx_run_project_id_flow_id_environment_created_desc"',
        )
        await queryRunner.query(
            'DROP INDEX "idx_run_project_id_flow_id_environment_status_created_desc"',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_run" RENAME TO "temporary_flow_run"',
        )
        await queryRunner.query(
            'CREATE TABLE "flow_run" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "projectId" varchar(21) NOT NULL, "flowId" varchar(21) NOT NULL, "flowVersionId" varchar(21) NOT NULL, "environment" varchar, "flowDisplayName" varchar NOT NULL, "logsFileId" varchar(21), "status" varchar NOT NULL, "tasks" integer, "startTime" datetime NOT NULL, "finishTime" datetime, "pauseMetadata" text, CONSTRAINT "fk_flow_run_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "fk_flow_run_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)',
        )
        await queryRunner.query(
            'INSERT INTO "flow_run"("id", "created", "updated", "projectId", "flowId", "flowVersionId", "environment", "flowDisplayName", "logsFileId", "status", "tasks", "startTime", "finishTime", "pauseMetadata") SELECT "id", "created", "updated", "projectId", "flowId", "flowVersionId", "environment", "flowDisplayName", "logsFileId", "status", "tasks", "startTime", "finishTime", "pauseMetadata" FROM "temporary_flow_run"',
        )
        await queryRunner.query('DROP TABLE "temporary_flow_run"')
        await queryRunner.query(
            'CREATE INDEX "idx_run_project_id_environment_created_desc" ON "flow_run" ("projectId", "environment", "created") ',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_run_project_id_environment_status_created_desc" ON "flow_run" ("projectId", "environment", "status", "created") ',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_run_project_id_flow_id_environment_created_desc" ON "flow_run" ("projectId", "flowId", "environment", "created") ',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_run_project_id_flow_id_environment_status_created_desc" ON "flow_run" ("projectId", "flowId", "environment", "status", "created") ',
        )
    }
}

async function migrationRan(
    migration: string,
    queryRunner: QueryRunner,
): Promise<boolean> {
    const result = await queryRunner.query(
        'SELECT * from migrations where name = ?',
        [migration],
    )
    return result.length > 0
}
