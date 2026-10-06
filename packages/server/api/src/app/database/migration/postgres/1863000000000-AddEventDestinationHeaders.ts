import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddEventDestinationHeaders1863000000000 implements Migration {
    name = 'AddEventDestinationHeaders1863000000000'
    breaking = false
    release = '0.93.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "event_destination"
            ADD COLUMN IF NOT EXISTS "headers" jsonb
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "event_destination"
            DROP COLUMN IF EXISTS "headers"
        `)
    }
}
