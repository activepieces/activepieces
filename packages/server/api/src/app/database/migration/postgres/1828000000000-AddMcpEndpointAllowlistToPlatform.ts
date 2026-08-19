import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddMcpEndpointAllowlistToPlatform1828000000000 implements Migration {
    name = 'AddMcpEndpointAllowlistToPlatform1828000000000'
    breaking = false
    release = '0.88.1'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "mcpServerEndpointAllowlist" jsonb
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "mcpServerEndpointAllowlist"
        `)
    }
}
