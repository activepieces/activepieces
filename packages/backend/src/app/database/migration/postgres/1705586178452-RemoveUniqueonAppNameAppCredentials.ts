import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveUniqueonAppNameAppCredentials1705586178452 implements MigrationInterface {
    name = 'RemoveUniqueonAppNameAppCredentials1705586178452'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."idx_app_credentials_projectId_appName"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_app_credentials_projectId_appName" ON "app_credential" ("appName", "projectId")
        `)
    }

}
