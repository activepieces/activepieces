import dayjs from 'dayjs'
import { MigrationInterface, QueryRunner } from 'typeorm'

export class ModifyProjectMembers1717961669938 implements MigrationInterface {
    name = 'ModifyProjectMembers1717961669938'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const projectMembers = await queryRunner.query('SELECT * FROM project_member WHERE status = \'ACTIVE\'')
        await queryRunner.query('TRUNCATE TABLE project_member CASCADE')
        await queryRunner.query(`
            DROP INDEX "idx_project_member_project_id_email_platform_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_member" DROP COLUMN "status"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_member" DROP COLUMN "email"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_member"
            ADD "userId" character varying(21) NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "project_member" DROP COLUMN "platformId"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_member"
            ADD "platformId" character varying(21) NOT NULL
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_member_project_id_user_id_platform_id" ON "project_member" ("projectId", "userId", "platformId")
        `)
        await queryRunner.query(`
            ALTER TABLE "project_member"
            ADD CONSTRAINT "fk_project_member_user_id" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        for (const projectMember of projectMembers) {
            if (projectMember.role === 'EXTERNAL_CUSTOMER') {
                projectMember.role = 'OPERATOR'
            }
            const user = await queryRunner.query(`SELECT * FROM "user" WHERE email = '${projectMember.email}' AND "platformId" = '${projectMember.platformId}'`)
            if (user.length === 0) {
                // Skip if user not found
                continue
            }
            await queryRunner.query(`
            INSERT INTO "project_member" ("id", "created", "updated", "projectId", "platformId", "userId", "role")
            VALUES ('${projectMember.id}','${dayjs(projectMember.created).toISOString()}', '${dayjs(projectMember.updated).toISOString()}', '${projectMember.projectId}', '${projectMember.platformId}', '${user[0].id}', '${projectMember.role}')
        `)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const projectMembers = await queryRunner.query('SELECT * FROM project_member')
        await queryRunner.query('TRUNCATE TABLE project_member CASCADE')

        await queryRunner.query(`
            ALTER TABLE "project_member" DROP CONSTRAINT "fk_project_member_user_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_project_member_project_id_user_id_platform_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_member" DROP COLUMN "platformId"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_member"
            ADD "platformId" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "project_member" DROP COLUMN "userId"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_member"
            ADD "email" character varying NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "project_member"
            ADD "status" character varying NOT NULL
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_member_project_id_email_platform_id" ON "project_member" ("projectId", "email", "platformId")
        `)
        for (const projectMember of projectMembers) {
            const user = await queryRunner.query(`SELECT * FROM "user" WHERE id = '${projectMember.userId}'`)
            await queryRunner.query(`
            INSERT INTO "project_member" ("id", "created", "updated", "projectId", "platformId", "email", "status", "role")
            VALUES ('${projectMember.id}','${dayjs(projectMember.created).toISOString()}', '${dayjs(projectMember.updated).toISOString()}', '${projectMember.projectId}', '${projectMember.platformId}', '${user.email}', '${projectMember.status}', '${projectMember.role}')
        `)
        }
    }

}
