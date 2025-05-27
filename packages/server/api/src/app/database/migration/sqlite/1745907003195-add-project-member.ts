import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProjectMember1745907003195 implements MigrationInterface {
    name = 'AddProjectMember1745907003195'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "project_member" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "userId" varchar(21) NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "projectRole" varchar(21) NOT NULL
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_member_project_id_user_id_platform_id" ON "project_member" ("projectId", "userId", "platformId")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_project_member_project_id_user_id_platform_id"
        `);
        await queryRunner.query(`
            DROP TABLE "project_member"
        `);
    }
}
