import { QueryRunner } from 'typeorm'
import { BackgroundMigration } from '../../../background-migration'
import { migrationHelpers } from '../../../migration-helpers'
import {
    FLOW_RUN_LEGACY_LIST_INDEXES,
    ReshapeFlowRunListIndexesForBarrierChildren1871000000000,
} from './1871000000000-ReshapeFlowRunListIndexesForBarrierChildren'

export class DropFlowRunLegacyListIndexes1872000000000 implements BackgroundMigration {
    name = 'DropFlowRunLegacyListIndexes1872000000000'
    release = '0.93.0'
    transaction = false as const

    public async up(queryRunner: QueryRunner): Promise<void> {
        await migrationHelpers.assertBackgroundMigrationComplete({
            queryRunner,
            migration: ReshapeFlowRunListIndexesForBarrierChildren1871000000000,
        })
        for (const index of FLOW_RUN_LEGACY_LIST_INDEXES) {
            await migrationHelpers.dropIndexConcurrently({ queryRunner, name: index.name })
        }
    }

    public async down(): Promise<void> {}
}
