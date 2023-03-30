import { CollectionId, FlowRunId, FlowVersion, FlowVersionId, ProjectId, RunEnvironment, TriggerType } from '@activepieces/shared'

type BaseJobData = {
    environment: RunEnvironment
    collectionId: CollectionId
    projectId: ProjectId

}

export type RepeatableJobData = {
    collectionId: CollectionId
    flowVersion: FlowVersion
    triggerType: TriggerType
} & BaseJobData

export type OneTimeJobData = {
    flowVersionId: FlowVersionId
    runId: FlowRunId
    payload: unknown
} & BaseJobData

export type JobData = RepeatableJobData | OneTimeJobData
