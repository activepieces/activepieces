import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveTriggerRunEntity1760992394073 implements MigrationInterface {
    name = 'RemoveTriggerRunEntity1760992394073'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "trigger_run";
        `)
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        /* noop */
    }
}
