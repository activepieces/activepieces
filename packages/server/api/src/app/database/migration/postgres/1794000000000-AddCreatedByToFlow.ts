import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddCreatedByToFlow1794000000000 implements Migration {
    name = 'AddCreatedByToFlow1794000000000'
    breaking = false
    release = '0.83.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow"
            ADD COLUMN "createdBy" jsonb
        `)

        await queryRunner.query(`
            CREATE INDEX "idx_flow_created_by_type"
            ON "flow" (("createdBy" ->> 'type'))
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_flow_created_by_type"')
        await queryRunner.query('ALTER TABLE "flow" DROP COLUMN IF EXISTS "createdBy"')
    }
}
