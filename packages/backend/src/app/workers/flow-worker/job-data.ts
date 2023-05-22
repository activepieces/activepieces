import { ExecutionType, FlowRunId, FlowVersion, FlowVersionId, ProjectId, RunEnvironment, TriggerType } from '@activepieces/shared'

export const LATEST_JOB_DATA_SCHEMA_VERSION = 1

type BaseJobData = {
    projectId: ProjectId
    environment: RunEnvironment
    executionType: ExecutionType
}

// Never change without increasing LATEST_JOB_DATA_SCHEMA_VERSION, and adding a migration
export type RepeatingJobData = BaseJobData & {
    schemaVersion: number
    flowVersion: FlowVersion
    triggerType: TriggerType
}

// Never change without increasing LATEST_JOB_DATA_SCHEMA_VERSION, and adding a migration
export type DelayedJobData = BaseJobData & {
    schemaVersion: number
    flowVersionId: FlowVersionId
    runId: FlowRunId
}

export type ScheduledJobData = RepeatingJobData | DelayedJobData

export type OneTimeJobData = BaseJobData & {
    flowVersionId: FlowVersionId
    runId: FlowRunId
    payload: unknown
}

export type JobData = ScheduledJobData | OneTimeJobData
