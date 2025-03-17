import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFlowTemplate1741588702453 implements MigrationInterface {
    name = 'AddFlowTemplate1741588702453'

    public async up(queryRunner: QueryRunner): Promise<void> {
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
                "blogUrl" varchar
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_flow_template_tags" ON "flow_template" ("tags")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_flow_template_pieces" ON "flow_template" ("pieces")
        `);
        await queryRunner.query(`
            DROP INDEX "idx_flow_template_tags"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_flow_template_pieces"
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
                CONSTRAINT "fk_flow_template_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_flow_template_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
            CREATE INDEX "idx_flow_template_tags" ON "flow_template" ("tags")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_flow_template_pieces" ON "flow_template" ("pieces")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_flow_template_pieces"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_flow_template_tags"
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
                "blogUrl" varchar
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
            CREATE INDEX "idx_flow_template_pieces" ON "flow_template" ("pieces")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_flow_template_tags" ON "flow_template" ("tags")
        `);
        await queryRunner.query(`
            DROP INDEX "idx_flow_template_pieces"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_flow_template_tags"
        `);
        await queryRunner.query(`
            DROP TABLE "flow_template"
        `);
    }

}
