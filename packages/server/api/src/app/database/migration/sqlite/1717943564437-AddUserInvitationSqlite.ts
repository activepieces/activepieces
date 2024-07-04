import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUserInvitationSqlite1717943564437 implements MigrationInterface {
    name = 'AddUserInvitationSqlite1717943564437'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
        CREATE TABLE "user_invitation" (
            "id" varchar(21) PRIMARY KEY NOT NULL,
            "created" datetime NOT NULL DEFAULT (datetime('now')),
            "updated" datetime NOT NULL DEFAULT (datetime('now')),
            "platformId" varchar NOT NULL,
            "type" varchar NOT NULL,
            "platformRole" varchar,
            "projectId" varchar,
            "projectRole" varchar,
            "status" varchar NOT NULL,
            "email" varchar NOT NULL
        )
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
            DROP TABLE "user_invitation"
        `)
    }

}
