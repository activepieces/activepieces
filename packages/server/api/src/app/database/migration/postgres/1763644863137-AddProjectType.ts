import { ApEdition, apId } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { isNotOneOfTheseEditions } from '../../database-common'

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
const BATCH_SIZE = 1000

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

        let excludedUsers: string[] = []
        if (isNotOneOfTheseEditions([ApEdition.ENTERPRISE, ApEdition.CLOUD])) {
            const rows = await queryRunner.query('SELECT "ownerId" FROM "project"')
            await queryRunner.query(`
                UPDATE "project"
                SET "type" = '${ProjectType.PERSONAL}'
            `)
            excludedUsers = rows.map((row: { ownerId: string }) => row.ownerId) as string[]
            system.globalLogger().info({
                excludedUsers: excludedUsers.length,
            }, 'AddProjectType1763644863137 up')
        }

        if (users.length > 0) {
            const eligibleUsers = users.filter((user: { id: string }) => !excludedUsers.includes(user.id))
            let totalCreated = 0
            for (let i = 0; i < eligibleUsers.length; i += BATCH_SIZE) {
                const batch = eligibleUsers.slice(i, i + BATCH_SIZE)
                const values: string[] = []
                const params: (string | boolean)[] = []
                let paramIndex = 1

                for (const user of batch) {
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
                    totalCreated += values.length
                    system.globalLogger().info({
                        projectsCreated: totalCreated,
                        batchSize: values.length,
                        batchStart: i,
                    }, 'AddProjectType1763644863137 up BATCH')
                }
            }
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
