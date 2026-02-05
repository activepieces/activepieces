import { apId } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

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
}

const COLORS = Object.values(ColorName)
const BATCH_SIZE = 1000

export class AddPersonalProjectsForAllUsers1765107860778 implements MigrationInterface {
    name = 'AddPersonalProjectsForAllUsers1765107860778'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const users = await queryRunner.query(`
            SELECT DISTINCT u.id, u."platformId", ui."firstName"
            FROM "user" u
            LEFT JOIN "user_identity" ui ON u."identityId" = ui.id
            LEFT JOIN "project" p ON u.id = p."ownerId" AND p.type = '${ProjectType.PERSONAL}'
            WHERE p.id IS NULL
        `)

        if (users.length === 0) {
            system.globalLogger().info('AddPersonalProjectsForAllUsers1765107860778: No users need personal projects')
            return
        }

        let totalCreated = 0
        for (let i = 0; i < users.length; i += BATCH_SIZE) {
            const batch = users.slice(i, i + BATCH_SIZE)
            const values: string[] = []
            const params: (string | boolean)[] = []
            let paramIndex = 1

            for (const user of batch) {
                const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)]

                const id = apId()
                const created = new Date().toISOString()
                const updated = new Date().toISOString()
                const ownerId = user.id
                const displayName = `${user.firstName}'s Project`
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
                }, 'AddPersonalProjectsForAllUsers1765107860778 up BATCH')
            }
        }

        system.globalLogger().info({
            totalProjectsCreated: totalCreated,
        }, 'AddPersonalProjectsForAllUsers1765107860778 up COMPLETED')
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // No down migration needed
    }

}
