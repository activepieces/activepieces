import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPreSelectForNewProjectsToAppConnection1772027509095 implements MigrationInterface {
    name = 'AddPreSelectForNewProjectsToAppConnection1772027509095'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ADD "preSelectForNewProjects" boolean NOT NULL DEFAULT false
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "app_connection" DROP COLUMN "preSelectForNewProjects"
        `)
    }
}
