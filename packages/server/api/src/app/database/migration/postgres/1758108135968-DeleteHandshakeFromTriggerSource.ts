import { MigrationInterface, QueryRunner } from 'typeorm'

export class DeleteHandshakeFromTriggerSource1758108135968 implements MigrationInterface {
    name = 'DeleteHandshakeFromTriggerSource1758108135968'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "trigger_source" DROP COLUMN "handshakeConfiguration"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "trigger_source"
            ADD "handshakeConfiguration" jsonb
        `)
    }

}
