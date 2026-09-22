import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class UniqueProjectRoleNamePerPlatform1852000000000 implements Migration {
    name = 'UniqueProjectRoleNamePerPlatform1852000000000'
    breaking = true
    release = '0.92.1'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            WITH ranked AS (
                SELECT pr."id", pr."platformId", pr."name", pr."created",
                       (SELECT COUNT(*) FROM "project_member" pm WHERE pm."projectRoleId" = pr."id") AS member_count
                FROM "project_role" pr
                WHERE pr."platformId" IS NOT NULL
            ),
            targets AS (
                SELECT "id", "platformId", "name",
                       ROW_NUMBER() OVER (
                           PARTITION BY "platformId", "name"
                           ORDER BY member_count DESC, "created", "id"
                       ) - 1 AS slot
                FROM ranked
            ),
            dupe_groups AS (
                SELECT DISTINCT "platformId", "name" FROM targets WHERE slot > 0
            ),
            free AS (
                SELECT d."platformId", d."name", g.n,
                       ROW_NUMBER() OVER (PARTITION BY d."platformId", d."name" ORDER BY g.n) AS slot
                FROM dupe_groups d
                CROSS JOIN generate_series(2, 1000) AS g(n)
                WHERE NOT EXISTS (
                    SELECT 1 FROM "project_role" e
                    WHERE e."platformId" = d."platformId"
                      AND e."name" = d."name" || ' (' || g.n || ')'
                )
            )
            UPDATE "project_role" r
            SET "name" = t."name" || ' (' || f.n || ')'
            FROM targets t
            JOIN free f
              ON f."platformId" = t."platformId" AND f."name" = t."name" AND f.slot = t.slot
            WHERE r."id" = t."id" AND t.slot > 0
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
