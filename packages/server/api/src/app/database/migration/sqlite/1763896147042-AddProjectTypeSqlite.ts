import { apId } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'

enum ProjectType {
    TEAM = 'TEAM',
    PERSONAL = 'PERSONAL',
}

enum ColorName {
    RED = 'RED',
    BLUE = 'BLUE',
    YELLOW = 'YELLOW',
    PURPLE = 'PURPLE',
    GREEN = 'GREEN',
    PINK = 'PINK',
    VIOLET = 'VIOLET',
    ORANGE = 'ORANGE',
    DARK_GREEN = 'DARK_GREEN',
    CYAN = 'CYAN',
    LAVENDER = 'LAVENDER',
    DEEP_ORANGE = 'DEEP_ORANGE',
}

const COLORS = Object.values(ColorName)

export class AddProjectTypeSqlite1763896147042 implements MigrationInterface {
    name = 'AddProjectTypeSqlite1763896147042'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_project_owner_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_project_platform_id_external_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_project" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "ownerId" varchar(21) NOT NULL,
                "displayName" varchar NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "externalId" varchar,
                "deleted" datetime,
                "releasesEnabled" boolean NOT NULL DEFAULT (0),
                "metadata" text,
                "maxConcurrentJobs" integer,
                "icon" text NOT NULL,
                "type" varchar NOT NULL,
                CONSTRAINT "fk_project_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
                CONSTRAINT "fk_project_owner_id" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_project"(
                    "id",
                    "created",
                    "updated",
                    "ownerId",
                    "displayName",
                    "platformId",
                    "externalId",
                    "deleted",
                    "releasesEnabled",
                    "metadata",
                    "maxConcurrentJobs",
                    "icon",
                    "type"
                )
            SELECT "id",
                "created",
                "updated",
                "ownerId",
                "displayName",
                "platformId",
                "externalId",
                "deleted",
                "releasesEnabled",
                "metadata",
                "maxConcurrentJobs",
                "icon",
                '${ProjectType.TEAM}'
            FROM "project"
        `)
        await queryRunner.query(`
            DROP TABLE "project"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_project"
                RENAME TO "project"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_project_owner_id" ON "project" ("ownerId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_platform_id_external_id" ON "project" ("platformId", "externalId")
            WHERE "deleted" IS NULL
        `)

        const users = await queryRunner.query(`
            SELECT u."id", u."platformId", ui."firstName" 
            FROM "user" u
            INNER JOIN "user_identity" ui ON u."identityId" = ui."id"
        `)

        let excludedUsers: string[] = []
        const rows = await queryRunner.query('SELECT "ownerId" FROM "project"')
        await queryRunner.query(`
                UPDATE "project"
                SET "type" = '${ProjectType.PERSONAL}'
            `)
        excludedUsers = rows.map((row: { ownerId: string }) => row.ownerId) as string[]


        if (users.length > 0) {
            const values: string[] = []
            const params: (string | boolean)[] = []
            let paramIndex = 1

            for (const user of users) {
                if (excludedUsers.includes(user.id)) {
                    continue
                }
                const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)]

                const id = apId()
                const created = new Date().toISOString()
                const updated = new Date().toISOString()
                const ownerId = user.id
                const displayName = user.firstName + '\'s Project'
                const type = ProjectType.PERSONAL
                const platformId = user.platformId
                const icon = JSON.stringify({ color: randomColor })
                const releasesEnabled = false

                values.push(
                    `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8})`,
                )
                params.push(id, created, updated, ownerId, displayName, type, platformId, icon, releasesEnabled)
                paramIndex += 9
            }

            if (values.length > 0) {
                await queryRunner.query(
                    `INSERT INTO "project" ("id", "created", "updated", "ownerId", "displayName", "type", "platformId", "icon", "releasesEnabled") 
                    VALUES ${values.join(', ')}`,
                    params,
                )
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "project" WHERE "type" = '${ProjectType.PERSONAL}'
        `)

        await queryRunner.query(`
            DROP INDEX "idx_project_platform_id_external_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_project_owner_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "project"
                RENAME TO "temporary_project"
        `)
        await queryRunner.query(`
            CREATE TABLE "project" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "ownerId" varchar(21) NOT NULL,
                "displayName" varchar NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "externalId" varchar,
                "deleted" datetime,
                "releasesEnabled" boolean NOT NULL DEFAULT (0),
                "metadata" text,
                "maxConcurrentJobs" integer,
                "icon" text NOT NULL,
                CONSTRAINT "fk_project_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
                CONSTRAINT "fk_project_owner_id" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "project"(
                    "id",
                    "created",
                    "updated",
                    "ownerId",
                    "displayName",
                    "platformId",
                    "externalId",
                    "deleted",
                    "releasesEnabled",
                    "metadata",
                    "maxConcurrentJobs",
                    "icon"
                )
            SELECT "id",
                "created",
                "updated",
                "ownerId",
                "displayName",
                "platformId",
                "externalId",
                "deleted",
                "releasesEnabled",
                "metadata",
                "maxConcurrentJobs",
                "icon"
            FROM "temporary_project"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_project"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_platform_id_external_id" ON "project" ("platformId", "externalId")
            WHERE "deleted" IS NULL
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_project_owner_id" ON "project" ("ownerId")
        `)
    }

}
