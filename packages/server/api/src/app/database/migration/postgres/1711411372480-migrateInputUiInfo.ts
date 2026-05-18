import { MigrationInterface, QueryRunner } from 'typeorm'

export class MigrateInputUiInfo1711411372480 implements MigrationInterface {
    name = 'MigrateInputUiInfo1711411372480'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // This input ui is no longer optional
        await queryRunner.query('UPDATE flow_version SET trigger = jsonb_set(trigger, \'{settings,inputUiInfo}\', \'{}\'::jsonb) WHERE trigger->\'settings\'->>\'inputUiInfo\' IS NULL;')

    }

    public async down(): Promise<void> {
        // This migration is irreversible and shouldn't be rolled back
    }

}
