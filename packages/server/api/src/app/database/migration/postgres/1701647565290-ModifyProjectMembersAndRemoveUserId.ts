import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'
import { ApEdition } from '@activepieces/shared'

export class ModifyProjectMembersAndRemoveUserId1701647565290
implements MigrationInterface {
    name = 'ModifyProjectMembersAndRemoveUserId1701647565290'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
        ALTER TABLE "project_member"
        ADD "email" character varying
    `)
        await queryRunner.query(`
        ALTER TABLE "project_member"
        ADD "platformId" character varying
    `)
        await queryRunner.query(`
        CREATE UNIQUE INDEX "idx_project_member_project_id_email_platform_id" ON "project_member" ("projectId", "email", "platformId")
    `)
        // Data migration
        await queryRunner.query(`
            UPDATE "project_member" SET "email" = "user"."email", "platformId" = "user"."platformId" FROM "user" WHERE "project_member"."userId" = "user"."id"
        `)
        await queryRunner.query(`
            UPDATE public.user SET "email" = CONCAT("email", 'deleted') WHERE "status" = 'INVITED';
        `)
        await queryRunner.query(`
            ALTER TABLE "project_member"
            ALTER COLUMN "email" SET NOT NULL;
        `)

        await queryRunner.query(`
            ALTER TABLE "project_member" DROP CONSTRAINT "fk_project_member_user_id"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_project_member_project_id_user_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_member" DROP COLUMN "userId"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            DROP INDEX "public"."idx_project_member_project_id_email_platform_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_member" DROP COLUMN "platformId"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_member" DROP COLUMN "email"
        `)
        await queryRunner.query(`
            ALTER TABLE "project_member"
            ADD "userId" character varying(21) NOT NULL
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_member_project_id_user_id" ON "project_member" ("userId", "projectId")
        `)
        await queryRunner.query(`
            ALTER TABLE "project_member"
            ADD CONSTRAINT "fk_project_member_user_id" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }
}
