import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddDataColumnToFieldEntity1742395892304 implements MigrationInterface {
    name = 'AddDataColumnToFieldEntity1742395892304'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "field"
            ADD "data" jsonb
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "field" DROP COLUMN "data"
        `)
    }

}
