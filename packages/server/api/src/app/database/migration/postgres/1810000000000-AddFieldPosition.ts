import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddFieldPosition1810000000000 implements Migration {
    name = 'AddFieldPosition1810000000000'
    breaking = false
    release = '0.86.3'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "field"
            ADD "position" integer NOT NULL DEFAULT '0'
        `)
        // No backfill: reads order by (position ASC, created ASC), so existing rows
        // left at position 0 already sort by created — identical to a 0..n-1 backfill.
        // A full-table UPDATE here would rewrite every row under the ADD COLUMN's
        // ACCESS EXCLUSIVE lock, blocking the field table on large cloud deploys.
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "field" DROP COLUMN "position"
        `)
    }
}
