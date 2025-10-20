import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveTriggerRunEntity1760993216501 implements MigrationInterface {
    name = 'RemoveTriggerRunEntity1760993216501'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            TRUNCATE TABLE "trigger_run";
        `)
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        /* noop */
    }
}
