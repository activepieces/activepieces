import { MigrationInterface, QueryRunner } from 'typeorm'

export class ProjectMember1752814412946 implements MigrationInterface {
    name = 'ProjectMember1752814412946'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "project_member" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "userId" character varying(21) NOT NULL,
                "platformId" character varying(21) NOT NULL,
                "projectId" character varying(21) NOT NULL,
                "projectRoleId" character varying(21) NOT NULL,
                CONSTRAINT "PK_64dba8e9dcf96ce383cfd19d6fb" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_member_project_id_user_id_platform_id" ON "project_member" ("projectId", "userId", "platformId")
        `)
        await queryRunner.query(`
            ALTER TABLE "project_member"
            ADD CONSTRAINT "fk_project_member_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "project_member"
            ADD CONSTRAINT "fk_project_member_user_id" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "project_member"
            ADD CONSTRAINT "fk_project_member_project_role_id" FOREIGN KEY ("projectRoleId") REFERENCES "project_role"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project_member" DROP CONSTRAINT "fk_project_member_project_role_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_member" DROP CONSTRAINT "fk_project_member_user_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_member" DROP CONSTRAINT "fk_project_member_project_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_project_member_project_id_user_id_platform_id"
        `)
        await queryRunner.query(`
            DROP TABLE "project_member"
        `)
    }
}
