import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class ClearAiUsageCopiedFromSharedCustomers1881000000000 implements Migration {
    name = 'ClearAiUsageCopiedFromSharedCustomers1881000000000'
    breaking = true
    release = '0.94.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            TRUNCATE "ai_usage_5m", "ai_usage_daily", "ai_usage_copy_cursor", "ai_usage_run"
        `)
    }

    public async down(): Promise<void> {}
}
