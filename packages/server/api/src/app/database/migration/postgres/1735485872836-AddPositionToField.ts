import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPositionToField1735485872836 implements MigrationInterface {
    name = 'AddPositionToField1735485872836'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "field"
            ADD "position" integer NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "field"
            ADD CONSTRAINT "UQ_92bf9f4f184be9b4d0f93f48b48" UNIQUE ("position")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "field" DROP CONSTRAINT "UQ_92bf9f4f184be9b4d0f93f48b48"
        `)
        await queryRunner.query(`
            ALTER TABLE "field" DROP COLUMN "position"
        `)
    }

}
