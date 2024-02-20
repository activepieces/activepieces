import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUserMetaInformation1693850082449 implements MigrationInterface {
    name = 'AddUserMetaInformation1693850082449'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "user" ADD "imageUrl" character varying',
        )
        await queryRunner.query('ALTER TABLE "user" ADD "title" character varying')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "user" DROP COLUMN "title"')
        await queryRunner.query('ALTER TABLE "user" DROP COLUMN "imageUrl"')
    }
}
