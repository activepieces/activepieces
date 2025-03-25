import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTodosSquashed1742874467240 implements MigrationInterface {
    name = 'AddTodosSquashed1742874467240'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "todo" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "title" varchar NOT NULL,
                "description" varchar,
                "status" text NOT NULL,
                "statusOptions" text NOT NULL,
                "assigneeId" varchar(21),
                "platformId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "runId" varchar(21),
                "approvalUrl" varchar
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_todo_project_id" ON "todo" ("projectId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_todo_flow_id" ON "todo" ("flowId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_todo_platform_id" ON "todo" ("platformId")
        `);
        await queryRunner.query(`
            DROP INDEX "idx_field_project_id_table_id_name"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_field" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "type" varchar CHECK("type" IN ('TEXT', 'NUMBER', 'DATE')) NOT NULL,
                "tableId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "data" text,
                CONSTRAINT "fk_field_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_field_table_id" FOREIGN KEY ("tableId") REFERENCES "table" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_field"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "type",
                    "tableId",
                    "projectId"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "type",
                "tableId",
                "projectId"
            FROM "field"
        `);
        await queryRunner.query(`
            DROP TABLE "field"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_field"
                RENAME TO "field"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_field_project_id_table_id_name" ON "field" ("projectId", "tableId", "name")
        `);
        await queryRunner.query(`
            DROP INDEX "idx_flow_template_pieces"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_flow_template_tags"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_flow_template" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "description" varchar NOT NULL,
                "type" varchar NOT NULL,
                "platformId" varchar NOT NULL,
                "projectId" varchar,
                "template" text NOT NULL,
                "tags" varchar array NOT NULL,
                "pieces" varchar array NOT NULL,
                "blogUrl" varchar,
                CONSTRAINT "fk_flow_template_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_flow_template_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_flow_template"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "description",
                    "type",
                    "platformId",
                    "projectId",
                    "template",
                    "tags",
                    "pieces",
                    "blogUrl"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "description",
                "type",
                "platformId",
                "projectId",
                "template",
                "tags",
                "pieces",
                "blogUrl"
            FROM "flow_template"
        `);
        await queryRunner.query(`
            DROP TABLE "flow_template"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_flow_template"
                RENAME TO "flow_template"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_flow_template_pieces" ON "flow_template" ("pieces")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_flow_template_tags" ON "flow_template" ("tags")
        `);
        await queryRunner.query(`
            DROP INDEX "idx_field_project_id_table_id_name"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_field" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "type" varchar CHECK(
                    "type" IN ('TEXT', 'NUMBER', 'DATE', 'STATIC_DROPDOWN')
                ) NOT NULL,
                "tableId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "data" text,
                CONSTRAINT "fk_field_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_field_table_id" FOREIGN KEY ("tableId") REFERENCES "table" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_field"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "type",
                    "tableId",
                    "projectId",
                    "data"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "type",
                "tableId",
                "projectId",
                "data"
            FROM "field"
        `);
        await queryRunner.query(`
            DROP TABLE "field"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_field"
                RENAME TO "field"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_field_project_id_table_id_name" ON "field" ("projectId", "tableId", "name")
        `);
        await queryRunner.query(`
            DROP INDEX "idx_todo_project_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_todo_flow_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_todo_platform_id"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_todo" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "title" varchar NOT NULL,
                "description" varchar,
                "status" text NOT NULL,
                "statusOptions" text NOT NULL,
                "assigneeId" varchar(21),
                "platformId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "runId" varchar(21),
                "approvalUrl" varchar,
                CONSTRAINT "fk_todo_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_todo_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_todo_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_todo_run_id" FOREIGN KEY ("runId") REFERENCES "flow_run" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_todo_assignee_id" FOREIGN KEY ("assigneeId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_todo"(
                    "id",
                    "created",
                    "updated",
                    "title",
                    "description",
                    "status",
                    "statusOptions",
                    "assigneeId",
                    "platformId",
                    "projectId",
                    "flowId",
                    "runId",
                    "approvalUrl"
                )
            SELECT "id",
                "created",
                "updated",
                "title",
                "description",
                "status",
                "statusOptions",
                "assigneeId",
                "platformId",
                "projectId",
                "flowId",
                "runId",
                "approvalUrl"
            FROM "todo"
        `);
        await queryRunner.query(`
            DROP TABLE "todo"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_todo"
                RENAME TO "todo"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_todo_project_id" ON "todo" ("projectId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_todo_flow_id" ON "todo" ("flowId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_todo_platform_id" ON "todo" ("platformId")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_todo_platform_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_todo_flow_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_todo_project_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "todo"
                RENAME TO "temporary_todo"
        `);
        await queryRunner.query(`
            CREATE TABLE "todo" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "title" varchar NOT NULL,
                "description" varchar,
                "status" text NOT NULL,
                "statusOptions" text NOT NULL,
                "assigneeId" varchar(21),
                "platformId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "runId" varchar(21),
                "approvalUrl" varchar
            )
        `);
        await queryRunner.query(`
            INSERT INTO "todo"(
                    "id",
                    "created",
                    "updated",
                    "title",
                    "description",
                    "status",
                    "statusOptions",
                    "assigneeId",
                    "platformId",
                    "projectId",
                    "flowId",
                    "runId",
                    "approvalUrl"
                )
            SELECT "id",
                "created",
                "updated",
                "title",
                "description",
                "status",
                "statusOptions",
                "assigneeId",
                "platformId",
                "projectId",
                "flowId",
                "runId",
                "approvalUrl"
            FROM "temporary_todo"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_todo"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_todo_platform_id" ON "todo" ("platformId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_todo_flow_id" ON "todo" ("flowId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_todo_project_id" ON "todo" ("projectId")
        `);
        await queryRunner.query(`
            DROP INDEX "idx_field_project_id_table_id_name"
        `);
        await queryRunner.query(`
            ALTER TABLE "field"
                RENAME TO "temporary_field"
        `);
        await queryRunner.query(`
            CREATE TABLE "field" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "type" varchar CHECK("type" IN ('TEXT', 'NUMBER', 'DATE')) NOT NULL,
                "tableId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "data" text,
                CONSTRAINT "fk_field_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_field_table_id" FOREIGN KEY ("tableId") REFERENCES "table" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "field"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "type",
                    "tableId",
                    "projectId",
                    "data"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "type",
                "tableId",
                "projectId",
                "data"
            FROM "temporary_field"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_field"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_field_project_id_table_id_name" ON "field" ("projectId", "tableId", "name")
        `);
        await queryRunner.query(`
            DROP INDEX "idx_flow_template_tags"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_flow_template_pieces"
        `);
        await queryRunner.query(`
            ALTER TABLE "flow_template"
                RENAME TO "temporary_flow_template"
        `);
        await queryRunner.query(`
            CREATE TABLE "flow_template" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "description" varchar NOT NULL,
                "type" varchar NOT NULL,
                "platformId" varchar NOT NULL,
                "projectId" varchar,
                "template" text NOT NULL,
                "tags" varchar array NOT NULL,
                "pieces" varchar array NOT NULL,
                "blogUrl" varchar,
                CONSTRAINT "fk_flow_template_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_flow_template_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "flow_template"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "description",
                    "type",
                    "platformId",
                    "projectId",
                    "template",
                    "tags",
                    "pieces",
                    "blogUrl"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "description",
                "type",
                "platformId",
                "projectId",
                "template",
                "tags",
                "pieces",
                "blogUrl"
            FROM "temporary_flow_template"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_flow_template"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_flow_template_tags" ON "flow_template" ("tags")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_flow_template_pieces" ON "flow_template" ("pieces")
        `);
        await queryRunner.query(`
            DROP INDEX "idx_field_project_id_table_id_name"
        `);
        await queryRunner.query(`
            ALTER TABLE "field"
                RENAME TO "temporary_field"
        `);
        await queryRunner.query(`
            CREATE TABLE "field" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "type" varchar CHECK("type" IN ('TEXT', 'NUMBER', 'DATE')) NOT NULL,
                "tableId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                CONSTRAINT "fk_field_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_field_table_id" FOREIGN KEY ("tableId") REFERENCES "table" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "field"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "type",
                    "tableId",
                    "projectId"
                )
            SELECT "id",
                "created",
                "updated",
                "name",
                "type",
                "tableId",
                "projectId"
            FROM "temporary_field"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_field"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_field_project_id_table_id_name" ON "field" ("projectId", "tableId", "name")
        `);
        await queryRunner.query(`
            DROP INDEX "idx_todo_platform_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_todo_flow_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_todo_project_id"
        `);
        await queryRunner.query(`
            DROP TABLE "todo"
        `);
    }

}
