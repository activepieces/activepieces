import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class AddVersionToOtp1827000000000 implements MigrationInterface {
    name = 'AddVersionToOtp1827000000000'
    breaking = false
    release = '0.88.1'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "otp"
            ADD COLUMN "version" integer NOT NULL DEFAULT 0
        `)
        log.info({ name: this.name }, 'otp version column added')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "otp"
            DROP COLUMN "version"
        `)
        log.info({ name: this.name }, 'otp version column dropped')
    }
}
