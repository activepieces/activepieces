import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

export class AddSampleDataFlowIdIndexToFile1812000000000 implements Migration {
    name = 'AddSampleDataFlowIdIndexToFile1812000000000'
    breaking = false
    release = '0.86.4'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isPGlite()) {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_file_sample_data_flow_id"
                ON "file" ("type", (("metadata"->>'flowId')))
                WHERE "type" IN ('SAMPLE_DATA', 'SAMPLE_DATA_INPUT')
            `)
        }
        else {
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_file_sample_data_flow_id"
                ON "file" ("type", (("metadata"->>'flowId')))
                WHERE "type" IN ('SAMPLE_DATA', 'SAMPLE_DATA_INPUT')
            `)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_file_sample_data_flow_id"')
    }
}

const isPGlite = (): boolean => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE
