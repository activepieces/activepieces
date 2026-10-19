import { QueryRunner } from 'typeorm'
import { BackgroundMigration } from '../../../background-migration'
import { migrationHelpers } from '../../../migration-helpers'

export class ReshapeFlowRunListIndexesForBarrierChildren1871000000000 implements BackgroundMigration {
    name = 'ReshapeFlowRunListIndexesForBarrierChildren1871000000000'
    release = '0.93.0'
    transaction = false as const

    public async up(queryRunner: QueryRunner): Promise<void> {
        for (const index of FLOW_RUN_BARRIER_INDEXES) {
            await migrationHelpers.createIndexConcurrently({ queryRunner, table: 'flow_run', ...index })
        }
        await migrationHelpers.dropIndexConcurrently({ queryRunner, name: FLOW_RUN_SHADOWING_LEGACY_INDEX_NAME })
    }

    public async down(): Promise<void> {}
}

export const FLOW_RUN_SHADOWING_LEGACY_INDEX_NAME = 'idx_run_project_id_environment_created_archived_at'

export const FLOW_RUN_BARRIER_INDEXES: FlowRunIndex[] = [
    {
        name: 'idx_run_parent_waitpoint_id',
        columns: '"parentWaitpointId", "projectId", "dispatchIndex", "status"',
        where: '"parentWaitpointId" IS NOT NULL',
    },
    {
        name: 'idx_run_project_env_status_created_archived_parent_waitpoint',
        columns: '"projectId", "environment", "status", "created" DESC, "archivedAt", "parentWaitpointId"',
    },
    {
        name: 'idx_run_project_env_created_archived_status_parent_waitpoint',
        columns: '"projectId", "environment", "created" DESC, "archivedAt", "status"',
        where: '"parentWaitpointId" IS NULL',
    },
    {
        name: 'idx_run_project_env_flow_created_archived_parent_waitpoint',
        columns: '"projectId", "environment", "flowId", "created" DESC, "archivedAt"',
        where: '"parentWaitpointId" IS NULL',
    },
    {
        name: 'idx_run_project_env_flow_status_created_parent_waitpoint',
        columns: '"projectId", "environment", "flowId", "status", "created" DESC, "archivedAt"',
        where: '"parentWaitpointId" IS NULL',
    },
]

export const FLOW_RUN_LEGACY_LIST_INDEXES: FlowRunIndex[] = [
    {
        name: 'idx_run_project_id_environment_status_created_archived_at',
        columns: '"projectId", "environment", "status", "created" DESC, "archivedAt"',
    },
    {
        name: 'idx_run_project_id_environment_created_status_archived_at',
        columns: '"projectId", "environment", "created" DESC, "archivedAt", "status"',
    },
    {
        name: FLOW_RUN_SHADOWING_LEGACY_INDEX_NAME,
        columns: '"projectId", "environment", "created" DESC, "archivedAt"',
    },
    {
        name: 'idx_run_project_id_environment_flow_id_created_archived_at',
        columns: '"projectId", "environment", "flowId", "created" DESC, "archivedAt"',
    },
    {
        name: 'idx_run_project_id_environment_flow_id_status_created_archived_',
        columns: '"projectId", "environment", "flowId", "status", "created" DESC, "archivedAt"',
    },
]

type FlowRunIndex = {
    name: string
    columns: string
    where?: string
}
