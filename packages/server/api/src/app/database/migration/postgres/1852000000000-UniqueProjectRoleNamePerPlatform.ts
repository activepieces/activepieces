import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class UniqueProjectRoleNamePerPlatform1852000000000 implements Migration {
    name = 'UniqueProjectRoleNamePerPlatform1852000000000'
    breaking = true
    release = '0.92.1'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "project_role" AS r
            SET "name" = r."name" || ' (' || d.rank || ')'
            FROM (
                SELECT pr."id", ROW_NUMBER() OVER (
                    PARTITION BY pr."platformId", pr."name"
                    ORDER BY (
                        SELECT COUNT(*) FROM "project_member" pm
                        WHERE pm."projectRoleId" = pr."id"
                    ) DESC, pr."created", pr."id"
                ) AS rank
                FROM "project_role" pr
                WHERE pr."platformId" IS NOT NULL
            ) AS d
            WHERE r."id" = d."id" AND d.rank > 1
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_role_platform_id_name"
            ON "project_role" ("platformId", "name")
            WHERE "platformId" IS NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_project_role_platform_id_name"
        `)
    }
}
