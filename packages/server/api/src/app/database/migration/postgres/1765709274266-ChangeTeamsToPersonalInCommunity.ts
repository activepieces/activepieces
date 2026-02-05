import { ApEdition } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'

export class ChangeTeamsToPersonalInCommunity1765709274266 implements MigrationInterface {
    name = 'ChangeTeamsToPersonalInCommunity1765709274266'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.COMMUNITY])) {
            return
        }
        await queryRunner.query(`
            UPDATE "project"
            SET "type" = 'PERSONAL'
        `)

        const oldestProjectRows: Array<{ id: string }> = await queryRunner.query(`
            SELECT p.id
            FROM "project" p
            INNER JOIN (
                SELECT "ownerId", MIN("created") AS min_created
                FROM "project"
                GROUP BY "ownerId"
            ) oldest
            ON p."ownerId" = oldest."ownerId" AND p."created" = oldest.min_created
        `)

        const oldestIds = oldestProjectRows.map(row => row.id)

        if (oldestIds.length > 0) {
            await queryRunner.query(
                `DELETE FROM "project" WHERE id NOT IN (${oldestIds.map((_, i) => `$${i + 1}`).join(',')})`,
                oldestIds,
            )
        }
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // No down migration needed
    }

}
