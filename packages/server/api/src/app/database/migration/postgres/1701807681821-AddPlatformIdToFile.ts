import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPlatformIdToFile1701807681821 implements MigrationInterface {
    name = 'AddPlatformIdToFile1701807681821'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "file"
            ADD "platformId" character varying(21)
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "file" DROP COLUMN "platformId"
        `)
    }
}
