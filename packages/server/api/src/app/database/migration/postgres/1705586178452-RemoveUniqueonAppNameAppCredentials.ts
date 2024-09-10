import { ApEdition } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'

export class RemoveUniqueonAppNameAppCredentials1705586178452
implements MigrationInterface {
    name = 'RemoveUniqueonAppNameAppCredentials1705586178452'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD])) {
            return
        }
        await queryRunner.query(`
            DROP INDEX "idx_app_credentials_projectId_appName"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD])) {
            return
        }
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_app_credentials_projectId_appName" ON "app_credential" ("appName", "projectId")
        `)
    }
}
