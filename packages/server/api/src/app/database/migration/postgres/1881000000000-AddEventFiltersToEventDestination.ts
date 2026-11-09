import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddEventFiltersToEventDestination1881000000000 implements Migration {
    name = 'AddEventFiltersToEventDestination1881000000000'
    breaking = false
    release = '0.94.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "event_destination" ADD COLUMN "eventFilters" jsonb
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "event_destination" DROP COLUMN "eventFilters"
        `)
    }
}
