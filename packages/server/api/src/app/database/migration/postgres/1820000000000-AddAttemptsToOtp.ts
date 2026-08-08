import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddAttemptsToOtp1820000000000 implements Migration {
    name = 'AddAttemptsToOtp1820000000000'
    breaking = false
    release = '0.87.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "otp"
            ADD "attempts" integer NOT NULL DEFAULT '0'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "otp" DROP COLUMN "attempts"
        `)
    }
}
