import { apId, ColorName } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'

enum ProjectType {
    TEAM = 'TEAM',
    PERSONAL = 'PERSONAL',
}

// Use the colors from shared; if we change them to icons in the future, we will need to update this migration.
const COLORS = Object.values(ColorName)

export class AddProjectType1763644863137 implements MigrationInterface {
    name = 'AddProjectType1763644863137'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD "type" character varying
        `)

        await queryRunner.query(`
            UPDATE "project" SET "type" = '${ProjectType.TEAM}'
        `)

        const users = await queryRunner.query(`
            SELECT u."id", u."platformId", ui."firstName" 
            FROM "user" u
            INNER JOIN "user_identity" ui ON u."identityId" = ui."id"
        `)
        
        if (users.length > 0) {
            const values: string[] = []
            const params: (string | boolean)[] = []
            let paramIndex = 1

            for (const user of users) {
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
            
            await queryRunner.query(
                `INSERT INTO "project" ("id", "created", "updated", "ownerId", "displayName", "type", "platformId", "icon", "releasesEnabled") 
                VALUES ${values.join(', ')}`,
                params,
            )
        }

        await queryRunner.query(`
            ALTER TABLE "project" ALTER COLUMN "type" SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "project" WHERE "type" = '${ProjectType.PERSONAL}'
        `)
        
        await queryRunner.query(`
            ALTER TABLE "project" DROP COLUMN "type"
        `)
    }

}
