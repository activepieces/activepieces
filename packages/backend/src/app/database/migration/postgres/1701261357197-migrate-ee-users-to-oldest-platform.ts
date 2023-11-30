import { MigrationInterface, QueryRunner } from 'typeorm'
import { databaseConnection } from '../../database-connection'
import { isNil } from '@activepieces/shared'

export class MigrateEeUsersToOldestPlatform1701261357197 implements MigrationInterface {
    name = 'MigrateEeUsersToOldestPlatform1701261357197'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const result = await databaseConnection.getRepository('platform').findOne({ where: {}, order: { created: 'ASC' } })

        if (isNil(result)) {
            return
        }

        await queryRunner.query(`
            UPDATE "user"
            SET "platformId" = '${result.id}'
            WHERE "platformId" IS NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "user"
            SET "platformId" = NULL
            WHERE "platformId" IS NOT NULL
        `)
    }

}
