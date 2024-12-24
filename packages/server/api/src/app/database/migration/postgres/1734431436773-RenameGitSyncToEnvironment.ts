import { ApEdition } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'

export class RenameGitSyncToEnvironment1734431436773 implements MigrationInterface {
    name = 'RenameGitSyncToEnvironment1734431436773'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
                RENAME COLUMN "gitSyncEnabled" TO "environmentEnabled"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
                RENAME COLUMN "environmentEnabled" TO "gitSyncEnabled"
        `)
    }

}
