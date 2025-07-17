import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddProjectRoleInvitation1752746475364 implements MigrationInterface {
    name = 'AddProjectRoleInvitation1752746475364'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_user_invitation_email_platform_project"
        `)
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
                "projectRoleId" varchar,
                CONSTRAINT "fk_user_invitation_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
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
        `)
        await queryRunner.query(`
            DROP TABLE "user_invitation"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_user_invitation"
                RENAME TO "user_invitation"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_invitation_email_platform_project" ON "user_invitation" ("email", "platformId", "projectId")
        `)

        await queryRunner.query(`
            DROP INDEX "idx_user_invitation_email_platform_project"
        `)
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
                "projectRoleId" varchar,
                CONSTRAINT "fk_user_invitation_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_user_invitation_project_role_id" FOREIGN KEY ("projectRoleId") REFERENCES "project_role" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
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
                    "status",
                    "projectRoleId"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "type",
                "platformRole",
                "email",
                "projectId",
                "status",
                "projectRoleId"
            FROM "user_invitation"
        `)
        await queryRunner.query(`
            DROP TABLE "user_invitation"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_user_invitation"
                RENAME TO "user_invitation"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_invitation_email_platform_project" ON "user_invitation" ("email", "platformId", "projectId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_user_invitation_email_platform_project"
        `)
        await queryRunner.query(`
            ALTER TABLE "user_invitation"
                RENAME TO "temporary_user_invitation"
        `)
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
                "projectRoleId" varchar,
                CONSTRAINT "fk_user_invitation_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
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
                    "status",
                    "projectRoleId"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "type",
                "platformRole",
                "email",
                "projectId",
                "status",
                "projectRoleId"
            FROM "temporary_user_invitation"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_user_invitation"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_invitation_email_platform_project" ON "user_invitation" ("email", "platformId", "projectId")
        `)

        await queryRunner.query(`
            DROP INDEX "idx_user_invitation_email_platform_project"
        `)
        await queryRunner.query(`
            ALTER TABLE "user_invitation"
                RENAME TO "temporary_user_invitation"
        `)
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
        `)
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
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_user_invitation"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_invitation_email_platform_project" ON "user_invitation" ("email", "platformId", "projectId")
        `)
    }
}
