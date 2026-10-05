import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddPieceSetRequiredActions1860000000000 implements Migration {
    name = 'AddPieceSetRequiredActions1860000000000'
    breaking = false
    release = '0.93.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "piece_set"
            SET "config" = jsonb_build_object('requiredActions', '[]'::jsonb, 'requiredActionsMode', 'any') || "config"
            WHERE NOT ("config" ? 'requiredActions') OR NOT ("config" ? 'requiredActionsMode')
        `)
        await queryRunner.query(`
            ALTER TABLE "piece_set"
            ALTER COLUMN "config" SET DEFAULT '{"pieces":{"mode":"include_all","exceptions":[]},"selectedActions":{},"selectedTriggers":{},"requiredActions":[],"requiredActionsMode":"any"}'::jsonb
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "piece_set"
            SET "config" = "config" - 'requiredActions' - 'requiredActionsMode'
        `)
        await queryRunner.query(`
            ALTER TABLE "piece_set"
            ALTER COLUMN "config" SET DEFAULT '{"pieces":{"mode":"include_all","exceptions":[]},"selectedActions":{},"selectedTriggers":{}}'::jsonb
        `)
    }
}
