import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRawWebhookRequestToTriggerEvent1716400000000 implements MigrationInterface {
    name = 'AddRawWebhookRequestToTriggerEvent1716400000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trigger_event" ADD "rawRequest" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trigger_event" DROP COLUMN "rawRequest"`);
    }
}