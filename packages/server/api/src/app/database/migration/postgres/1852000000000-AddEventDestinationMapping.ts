import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddEventDestinationMapping1852000000000 implements Migration {
    name = 'AddEventDestinationMapping1852000000000'
    breaking = false
    release = '0.92.1'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "event_destination"
            ADD COLUMN IF NOT EXISTS "name" character varying,
            ADD COLUMN IF NOT EXISTS "type" character varying NOT NULL DEFAULT 'CUSTOM',
            ADD COLUMN IF NOT EXISTS "enabled" boolean NOT NULL DEFAULT true,
            ADD COLUMN IF NOT EXISTS "headers" jsonb,
            ADD COLUMN IF NOT EXISTS "mapper" jsonb
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "event_destination"
            DROP COLUMN IF EXISTS "name",
            DROP COLUMN IF EXISTS "type",
            DROP COLUMN IF EXISTS "enabled",
            DROP COLUMN IF EXISTS "headers",
            DROP COLUMN IF EXISTS "mapper"
        `)
    }
}
