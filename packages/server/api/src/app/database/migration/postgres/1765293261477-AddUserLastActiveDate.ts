import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUserLastActiveDate1765293261477 implements MigrationInterface {
    name = 'AddUserLastActiveDate1765293261477'

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
