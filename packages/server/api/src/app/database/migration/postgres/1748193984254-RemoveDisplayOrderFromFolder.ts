import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveDisplayOrderFromFolder1748193984254 implements MigrationInterface {
    name = 'RemoveDisplayOrderFromFolder1748193984254'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "folder" DROP COLUMN "displayOrder"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "folder"
            ADD "displayOrder" integer NOT NULL DEFAULT '0'
        `);
    }

}
