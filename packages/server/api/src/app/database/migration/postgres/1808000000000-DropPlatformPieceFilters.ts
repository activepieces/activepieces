import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class DropPlatformPieceFilters1808000000000 implements Migration {
    name = 'DropPlatformPieceFilters1808000000000'
    breaking = false
    release = '0.103.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
                DROP COLUMN IF EXISTS "filteredPieceNames",
                DROP COLUMN IF EXISTS "filteredPieceBehavior",
                DROP COLUMN IF EXISTS "filteredActionNames",
                DROP COLUMN IF EXISTS "filteredTriggerNames"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
                ADD COLUMN IF NOT EXISTS "filteredPieceNames" character varying array NOT NULL DEFAULT '{}',
                ADD COLUMN IF NOT EXISTS "filteredPieceBehavior" character varying NOT NULL DEFAULT 'BLOCKED',
                ADD COLUMN IF NOT EXISTS "filteredActionNames" jsonb NOT NULL DEFAULT '{}',
                ADD COLUMN IF NOT EXISTS "filteredTriggerNames" jsonb NOT NULL DEFAULT '{}'
        `)
    }
}
