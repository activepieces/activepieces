import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddActivepiecesAiProviderHiddenToPlatformPlan1872000000000 implements Migration {
    name = 'AddActivepiecesAiProviderHiddenToPlatformPlan1872000000000'
    breaking = false
    release = '0.93.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD COLUMN IF NOT EXISTS "activepiecesAiProviderHidden" BOOLEAN NOT NULL DEFAULT false
        `)
        await queryRunner.query(`
            UPDATE "platform_plan"
            SET "activepiecesAiProviderHidden" = true
            WHERE "embeddingEnabled" = true
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            DROP COLUMN IF EXISTS "activepiecesAiProviderHidden"
        `)
    }
}
