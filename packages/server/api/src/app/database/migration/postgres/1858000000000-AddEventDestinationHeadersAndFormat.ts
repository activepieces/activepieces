import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddEventDestinationHeadersAndFormat1858000000000 implements Migration {
    name = 'AddEventDestinationHeadersAndFormat1858000000000'
    breaking = false
    release = '0.92.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "event_destination"
            ADD COLUMN IF NOT EXISTS "enabled" boolean NOT NULL DEFAULT true,
            ADD COLUMN IF NOT EXISTS "headers" jsonb,
            ADD COLUMN IF NOT EXISTS "format" character varying NOT NULL DEFAULT 'RAW'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "event_destination"
            DROP COLUMN IF EXISTS "enabled",
            DROP COLUMN IF EXISTS "headers",
            DROP COLUMN IF EXISTS "format"
        `)
    }
}
