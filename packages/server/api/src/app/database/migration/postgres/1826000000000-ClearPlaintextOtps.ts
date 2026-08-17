import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class ClearPlaintextOtps1826000000000 implements MigrationInterface {
    name = 'ClearPlaintextOtps1826000000000'
    breaking = false
    release = '0.88.1'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const result = await queryRunner.query('DELETE FROM "otp"')
        log.info({ name: this.name, result }, 'cleared one-time codes written before hashing')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const result = await queryRunner.query('DELETE FROM "otp"')
        log.info({ name: this.name, result }, 'cleared hashed one-time codes on rollback')
    }
}
