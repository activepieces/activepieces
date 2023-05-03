import { FlowRunId, FlowVersion, FlowVersionId, ProjectId, RunEnvironment, TriggerType } from '@activepieces/shared'

type BaseJobData = {
    environment: RunEnvironment
    projectId: ProjectId
}

export type RepeatableJobData = {
    flowVersion: FlowVersion
    triggerType: TriggerType
} & BaseJobData

export type OneTimeJobData = {
    flowVersionId: FlowVersionId
    runId: FlowRunId
    payload: unknown
} & BaseJobData

export type JobData = RepeatableJobData | OneTimeJobData
