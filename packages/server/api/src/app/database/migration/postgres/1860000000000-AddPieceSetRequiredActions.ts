import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddPieceSetRequiredActions1860000000000 implements Migration {
    name = 'AddPieceSetRequiredActions1860000000000'
    breaking = false
    release = '0.93.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "piece_set"
            ALTER COLUMN "config" SET DEFAULT '{"pieces":{"mode":"include_all","exceptions":[]},"selectedActions":{},"selectedTriggers":{},"requiredActions":{"mode":"any","actions":{}}}'
        `)
        await queryRunner.query(`
            UPDATE "piece_set"
            SET "config" = jsonb_set("config", '{requiredActions}', '{"mode":"any","actions":{}}'::jsonb)
            WHERE "config" -> 'requiredActions' IS NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "piece_set"
            SET "config" = "config" - 'requiredActions'
            WHERE "config" -> 'requiredActions' = '{"mode":"any","actions":{}}'::jsonb
        `)
        await queryRunner.query(`
            ALTER TABLE "piece_set"
            ALTER COLUMN "config" SET DEFAULT '{"pieces":{"mode":"include_all","exceptions":[]},"selectedActions":{},"selectedTriggers":{}}'
        `)
    }
}
