import { ExecutionType, FlowId, FlowRetryPayload, FlowRunId, FlowVersionId, ProjectId, RunEnvironment, TriggerType } from '@activepieces/shared'
import { HookType } from '../../flows/flow-run/flow-run-service'

export const LATEST_JOB_DATA_SCHEMA_VERSION = 3

type BaseJobData = {
    projectId: ProjectId
    environment: RunEnvironment
}

// Never change without increasing LATEST_JOB_DATA_SCHEMA_VERSION, and adding a migration
export type RepeatingJobData = BaseJobData & {
    schemaVersion: number
    flowVersionId: FlowVersionId
    flowId: FlowId
    triggerType: TriggerType
    executionType: ExecutionType.BEGIN
}

// Never change without increasing LATEST_JOB_DATA_SCHEMA_VERSION, and adding a migration
export type DelayedJobData = BaseJobData & {
    schemaVersion: number
    flowVersionId: FlowVersionId
    runId: FlowRunId
    executionType: ExecutionType.RESUME
}

export type ScheduledJobData = RepeatingJobData | DelayedJobData

export type OneTimeJobData = BaseJobData & {
    flowVersionId: FlowVersionId
    runId: FlowRunId
    synchronousHandlerId?: string
    payload: unknown
    executionType: ExecutionType
    retryPayload?: FlowRetryPayload
    hookType?: HookType
}

export type JobData = ScheduledJobData | OneTimeJobData