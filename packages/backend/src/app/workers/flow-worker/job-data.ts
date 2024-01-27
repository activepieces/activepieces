import { ExecutionType, FlowId, FlowRetryPayload, FlowRunId, FlowVersionId, ProjectId, RunEnvironment, TriggerType } from '@activepieces/shared'

export const LATEST_JOB_DATA_SCHEMA_VERSION = 4

type BaseJobData = {
    projectId: ProjectId
    environment: RunEnvironment
}

export enum RepeatableJobType {
    RENEW_WEBHOOK = 'RENEW_WEBHOOK',
    EXECUTE_TRIGGER = 'EXECUTE_TRIGGER',
    DELAYED_FLOW = 'DELAYED_FLOW',
}

// Never change without increasing LATEST_JOB_DATA_SCHEMA_VERSION, and adding a migration
export type RenewWebhookJobData = {
    schemaVersion: number
    projectId: ProjectId
    flowVersionId: FlowVersionId
    flowId: FlowId
    jobType: RepeatableJobType.RENEW_WEBHOOK
}

// Never change without increasing LATEST_JOB_DATA_SCHEMA_VERSION, and adding a migration
export type RepeatingJobData = BaseJobData & {
    schemaVersion: number
    flowVersionId: FlowVersionId
    flowId: FlowId
    triggerType: TriggerType
    jobType: RepeatableJobType.EXECUTE_TRIGGER
}

// Never change without increasing LATEST_JOB_DATA_SCHEMA_VERSION, and adding a migration
export type DelayedJobData = BaseJobData & {
    schemaVersion: number
    flowVersionId: FlowVersionId
    runId: FlowRunId
    jobType: RepeatableJobType.DELAYED_FLOW
}

export type ScheduledJobData = RepeatingJobData | DelayedJobData | RenewWebhookJobData

export type OneTimeJobData = BaseJobData & {
    flowVersionId: FlowVersionId
    runId: FlowRunId
    synchronousHandlerId?: string
    payload: unknown
    executionType: ExecutionType
    retryPayload?: FlowRetryPayload
}

export type JobData = ScheduledJobData | OneTimeJobData