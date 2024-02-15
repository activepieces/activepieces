import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddDatasourcesLimit1695916063833 implements MigrationInterface {
    name = 'AddDatasourcesLimit1695916063833'

    public async up(queryRunner: QueryRunner): Promise<void> {
    // Add the "datasources" column with a default value of 1
        await queryRunner.query(
            'ALTER TABLE "project_plan" ADD "datasources" integer NOT NULL DEFAULT 1',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the "datasources" column
        await queryRunner.query(
            'ALTER TABLE "project_plan" DROP COLUMN "datasources"',
        )
    }
}
