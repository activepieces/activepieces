import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddCreatedByToFlow1794000000000 implements Migration {
    name = 'AddCreatedByToFlow1794000000000'
    breaking = false
    release = '0.83.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow"
            ADD COLUMN IF NOT EXISTS "createdBy" jsonb
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "flow" DROP COLUMN IF EXISTS "createdBy"')
    }
}
