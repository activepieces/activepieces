import { MigrationInterface, QueryRunner } from 'typeorm'

export class ProjectMember1752814553291 implements MigrationInterface {
    name = 'ProjectMember1752814553291'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "project_member" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "userId" varchar(21) NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "projectRoleId" varchar(21) NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_member_project_id_user_id_platform_id" ON "project_member" ("projectId", "userId", "platformId")
        `)

        await queryRunner.query(`
            DROP INDEX "idx_project_member_project_id_user_id_platform_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_project_member" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "userId" varchar(21) NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "projectRoleId" varchar(21) NOT NULL,
                CONSTRAINT "fk_project_member_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_project_member_user_id" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_project_member_project_role_id" FOREIGN KEY ("projectRoleId") REFERENCES "project_role" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_project_member"(
                    "id",
                    "created",
                    "updated",
                    "userId",
                    "platformId",
                    "projectId",
                    "projectRoleId"
                )
            SELECT "id",
                "created",
                "updated",
                "userId",
                "platformId",
                "projectId",
                "projectRoleId"
            FROM "project_member"
        `)
        await queryRunner.query(`
            DROP TABLE "project_member"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_project_member"
                RENAME TO "project_member"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_member_project_id_user_id_platform_id" ON "project_member" ("projectId", "userId", "platformId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_project_member_project_id_user_id_platform_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_member"
                RENAME TO "temporary_project_member"
        `)
        await queryRunner.query(`
            CREATE TABLE "project_member" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "userId" varchar(21) NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "projectRoleId" varchar(21) NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "project_member"(
                    "id",
                    "created",
                    "updated",
                    "userId",
                    "platformId",
                    "projectId",
                    "projectRoleId"
                )
            SELECT "id",
                "created",
                "updated",
                "userId",
                "platformId",
                "projectId",
                "projectRoleId"
            FROM "temporary_project_member"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_project_member"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_member_project_id_user_id_platform_id" ON "project_member" ("projectId", "userId", "platformId")
        `)

        await queryRunner.query(`
            DROP INDEX "idx_project_member_project_id_user_id_platform_id"
        `)
        await queryRunner.query(`
            DROP TABLE "project_member"
        `)
    }
}
