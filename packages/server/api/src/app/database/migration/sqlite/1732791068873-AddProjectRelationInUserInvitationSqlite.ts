import { logger } from '@activepieces/server-shared'
import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddProjectRelationInUserInvitationSqlite1732791068873 implements MigrationInterface {
    name = 'AddProjectRelationInUserInvitationSqlite1732791068873'

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info({
            name: this.name,
        }, 'up')
        await queryRunner.query(`
            DELETE FROM "user_invitation" 
            WHERE "projectId" IS NOT NULL 
            AND "projectId" NOT IN (SELECT "id" FROM "project")
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
                "projectId" varchar,
                "projectRoleId" varchar,
                "status" varchar NOT NULL,
                "email" varchar NOT NULL
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
                    "projectId",
                    "projectRoleId",
                    "status",
                    "email"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "type",
                "platformRole",
                "projectId",
                "projectRoleId",
                "status",
                "email"
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
                "projectId" varchar,
                "projectRoleId" varchar,
                "status" varchar NOT NULL,
                "email" varchar NOT NULL,
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
                    "projectId",
                    "projectRoleId",
                    "status",
                    "email"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "type",
                "platformRole",
                "projectId",
                "projectRoleId",
                "status",
                "email"
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
        logger.info({
            name: this.name,
        }, 'down')
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
                "projectId" varchar,
                "projectRoleId" varchar,
                "status" varchar NOT NULL,
                "email" varchar NOT NULL
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
                    "projectId",
                    "projectRoleId",
                    "status",
                    "email"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "type",
                "platformRole",
                "projectId",
                "projectRoleId",
                "status",
                "email"
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
                "projectId" varchar,
                "projectRoleId" varchar,
                "status" varchar NOT NULL,
                "email" varchar NOT NULL,
                CONSTRAINT "FK_aa50e85a5d89f9289163d0e0f91" FOREIGN KEY ("projectRoleId") REFERENCES "project_role" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
                    "projectId",
                    "projectRoleId",
                    "status",
                    "email"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "type",
                "platformRole",
                "projectId",
                "projectRoleId",
                "status",
                "email"
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
