import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

export class AddIndexOnFlowVersionConnectionIds1762100000000 implements MigrationInterface {
    name = 'AddIndexOnFlowVersionConnectionIds1762100000000'

    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        system.globalLogger().info({
            name: 'AddIndexOnFlowVersionConnectionIds1762100000000',
            message: 'up',
        })
        
        await queryRunner.query(`
            CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_flow_version_connection_ids" 
            ON "flow_version" USING GIN ("connectionIds");
        `)
        
        system.globalLogger().info({
            name: 'AddIndexOnFlowVersionConnectionIds1762100000000',
            message: 'completed',
        })
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_flow_version_connection_ids";
        `)
    }
}
