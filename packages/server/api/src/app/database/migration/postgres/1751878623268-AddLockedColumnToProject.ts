import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLockedColumnToProject1751878623268 implements MigrationInterface {
    name = 'AddLockedColumnToProject1751878623268'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD "locked" boolean NOT NULL DEFAULT false
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project" DROP COLUMN "locked"
        `);
    }

}
