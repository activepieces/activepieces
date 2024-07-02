import { ApEdition, isNil } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'

export class MigrateEeUsersToOldestPlatform1701261357197
implements MigrationInterface {
    name = 'MigrateEeUsersToOldestPlatform1701261357197'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.ENTERPRISE])) {
            return
        }
        const result = await queryRunner.query(`
        SELECT *
        FROM platform
        ORDER BY created ASC
        LIMIT 1;
        `)

        if (isNil(result) || result.length == 0) {
            return
        }

        await queryRunner.query(`
            UPDATE "user"
            SET "platformId" = '${result[0].id}'
            WHERE "platformId" IS NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            UPDATE "user"
            SET "platformId" = NULL
            WHERE "platformId" IS NOT NULL
        `)
    }
}
