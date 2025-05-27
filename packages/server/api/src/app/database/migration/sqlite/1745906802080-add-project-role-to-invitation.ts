import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProjectRoleToInvitation1745906802080 implements MigrationInterface {
    name = 'AddProjectRoleToInvitation1745906802080'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_user_invitation_email_platform_project"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_user_invitation" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar NOT NULL,
                "type" varchar NOT NULL,
                "platformRole" varchar,
                "email" varchar NOT NULL,
                "projectId" varchar,
                "status" varchar NOT NULL,
                "projectRole" varchar,
                CONSTRAINT "fk_user_invitation_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_user_invitation"(
                    "id",
                    "created",
                    "updated",
                    "platformId",
                    "type",
                    "platformRole",
                    "email",
                    "projectId",
                    "status"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "type",
                "platformRole",
                "email",
                "projectId",
                "status"
            FROM "user_invitation"
        `);
        await queryRunner.query(`
            DROP TABLE "user_invitation"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_user_invitation"
                RENAME TO "user_invitation"
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_invitation_email_platform_project" ON "user_invitation" ("email", "platformId", "projectId")
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
                "metadata" text,
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
                    "blogUrl",
                    "metadata"
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
                "blogUrl",
                "metadata"
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
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
                "metadata" text,
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
                    "blogUrl",
                    "metadata"
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
                "blogUrl",
                "metadata"
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
            DROP INDEX "idx_user_invitation_email_platform_project"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_invitation"
                RENAME TO "temporary_user_invitation"
        `);
        await queryRunner.query(`
            CREATE TABLE "user_invitation" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar NOT NULL,
                "type" varchar NOT NULL,
                "platformRole" varchar,
                "email" varchar NOT NULL,
                "projectId" varchar,
                "status" varchar NOT NULL,
                CONSTRAINT "fk_user_invitation_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "user_invitation"(
                    "id",
                    "created",
                    "updated",
                    "platformId",
                    "type",
                    "platformRole",
                    "email",
                    "projectId",
                    "status"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "type",
                "platformRole",
                "email",
                "projectId",
                "status"
            FROM "temporary_user_invitation"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_user_invitation"
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_invitation_email_platform_project" ON "user_invitation" ("email", "platformId", "projectId")
        `);
    }

}
