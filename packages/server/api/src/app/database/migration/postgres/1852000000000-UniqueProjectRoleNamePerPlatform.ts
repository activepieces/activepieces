import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class UniqueProjectRoleNamePerPlatform1852000000000 implements Migration {
    name = 'UniqueProjectRoleNamePerPlatform1852000000000'
    breaking = false
    release = '0.92.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            WITH ranked AS (
                SELECT pr."id", pr."platformId", pr."name", LOWER(pr."name") AS lower_name, pr."created",
                       (SELECT COUNT(*) FROM "project_member" pm WHERE pm."projectRoleId" = pr."id") AS member_count
                FROM "project_role" pr
                WHERE pr."platformId" IS NOT NULL
            ),
            targets AS (
                SELECT "id", "platformId", "name", lower_name,
                       ROW_NUMBER() OVER (
                           PARTITION BY "platformId", lower_name
                           ORDER BY member_count DESC, "created", "id"
                       ) - 1 AS slot
                FROM ranked
            ),
            dupe_groups AS (
                SELECT DISTINCT loser."platformId", loser.lower_name, keeper."name" AS base
                FROM targets loser
                JOIN targets keeper
                  ON keeper."platformId" = loser."platformId"
                 AND keeper.lower_name = loser.lower_name
                 AND keeper.slot = 0
                WHERE loser.slot > 0
            ),
            free AS (
                SELECT d."platformId", d.lower_name, d.base, g.n,
                       ROW_NUMBER() OVER (PARTITION BY d."platformId", d.lower_name ORDER BY g.n) AS slot
                FROM dupe_groups d
                CROSS JOIN generate_series(2, (SELECT 2 * COUNT(*) + 2 FROM "project_role")) AS g(n)
                WHERE NOT EXISTS (
                    SELECT 1 FROM "project_role" e
                    WHERE e."platformId" = d."platformId"
                      AND LOWER(e."name") = LOWER(d.base || ' (' || g.n || ')')
                )
            )
            UPDATE "project_role" r
            SET "name" = f.base || ' (' || f.n || ')'
            FROM targets t
            JOIN free f
              ON f."platformId" = t."platformId" AND f.lower_name = t.lower_name AND f.slot = t.slot
            WHERE r."id" = t."id" AND t.slot > 0
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_role_platform_id_name"
            ON "project_role" ("platformId", LOWER("name"))
            WHERE "platformId" IS NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_project_role_platform_id_name"
        `)
    }
}
