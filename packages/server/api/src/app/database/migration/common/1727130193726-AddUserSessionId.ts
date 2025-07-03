import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUserSessionId1727130193726 implements MigrationInterface {
    name = 'AddUserSessionId1727130193726'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD "tokenVersion" character varying
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user" DROP COLUMN "tokenVersion"
        `)
    }

}