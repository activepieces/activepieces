import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveProjectIdFromIndex1750712746125 implements MigrationInterface {
    name = 'RemoveProjectIdFromIndex1750712746125'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_app_connection_project_ids_and_external_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_app_connection_platform_id"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_platform_id_and_external_id" ON "app_connection" ("platformId", "externalId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_app_connection_platform_id_and_external_id"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_platform_id" ON "app_connection" ("platformId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_project_ids_and_external_id" ON "app_connection" ("projectIds", "externalId")
        `)
    }

}
