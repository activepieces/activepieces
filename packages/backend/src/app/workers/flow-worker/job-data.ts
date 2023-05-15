import { ExecutionType, FlowRunId, FlowVersion, FlowVersionId, ProjectId, RunEnvironment, TriggerType } from '@activepieces/shared'

type BaseJobData = {
    projectId: ProjectId
    environment: RunEnvironment
    executionType: ExecutionType
}

export type RepeatingJobData = BaseJobData & {
    flowVersion: FlowVersion
    triggerType: TriggerType
}

export type DelayedJobData = BaseJobData & {
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
