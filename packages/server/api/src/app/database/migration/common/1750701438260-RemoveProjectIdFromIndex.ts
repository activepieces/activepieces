import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveProjectIdFromIndex1750701438260 implements MigrationInterface {
    name = 'RemoveProjectIdFromIndex1750701438260'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_app_connection_project_ids_and_external_id"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_external_id" ON "app_connection" ("externalId")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_app_connection_external_id"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_project_ids_and_external_id" ON "app_connection" ("externalId", "projectIds")
        `);
    }

}
