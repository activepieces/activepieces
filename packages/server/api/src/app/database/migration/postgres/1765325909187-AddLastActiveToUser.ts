import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddLastActiveToUser1765325909187 implements MigrationInterface {
    name = 'AddLastActiveToUser1765325909187'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD "lastActiveDate" TIMESTAMP WITH TIME ZONE
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user" DROP COLUMN "lastActiveDate"
        `)
    }

}
