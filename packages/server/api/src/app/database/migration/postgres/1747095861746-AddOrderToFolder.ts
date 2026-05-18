import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddOrderToFolder1747095861746 implements MigrationInterface {
    name = 'AddOrderToFolder1747095861746'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "folder"
            ADD "displayOrder" integer NOT NULL DEFAULT '0'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "folder" DROP COLUMN "displayOrder"
        `)
    }

}
