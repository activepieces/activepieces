import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddHandshakeConfigurationToFlow1746848208563 implements MigrationInterface {
    name = 'AddHandshakeConfigurationToFlow1746848208563'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow"
            ADD "handshakeConfiguration" jsonb
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow" DROP COLUMN "handshakeConfiguration"
        `)
    }

}
