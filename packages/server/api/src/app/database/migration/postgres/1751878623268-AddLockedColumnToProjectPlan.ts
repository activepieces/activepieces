import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddLockedColumnToProjectPlan1751878623268 implements MigrationInterface {
    name = 'AddLockedColumnToProjectPlan1751878623268'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project_plan"
            ADD "locked" boolean NOT NULL DEFAULT false
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project_plan" DROP COLUMN "locked"
        `)
    }

}
