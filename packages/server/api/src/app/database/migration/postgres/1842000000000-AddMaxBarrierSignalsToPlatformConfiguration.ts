import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddMaxBarrierSignalsToPlatformConfiguration1842000000000 implements Migration {
    name = 'AddMaxBarrierSignalsToPlatformConfiguration1842000000000'
    breaking = false
    release = '0.91.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_configuration"
            ADD COLUMN "maxBarrierSignals" integer NOT NULL DEFAULT 10000
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_configuration"
            DROP COLUMN "maxBarrierSignals"
        `)
    }
}
