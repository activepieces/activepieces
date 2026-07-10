import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class DropLegacyAiUsageSqlite1807000000000 implements Migration {
    name = 'DropLegacyAiUsageSqlite1807000000000'
    breaking = false
    release = '0.86.3'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS "ai_usage"')
    }

    public async down(): Promise<void> {
        return
    }
}
