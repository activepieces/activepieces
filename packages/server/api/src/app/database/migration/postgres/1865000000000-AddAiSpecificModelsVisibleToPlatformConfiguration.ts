import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddAiSpecificModelsVisibleToPlatformConfiguration1865000000000 implements Migration {
    name = 'AddAiSpecificModelsVisibleToPlatformConfiguration1865000000000'
    breaking = false
    release = '0.93.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_configuration"
            ADD COLUMN "aiSpecificModelsVisible" boolean NOT NULL DEFAULT true
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_configuration"
            DROP COLUMN "aiSpecificModelsVisible"
        `)
    }
}
