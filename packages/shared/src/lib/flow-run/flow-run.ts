import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, Nullable } from '../common/base-model'
import { ApId } from '../common/id-generator'
import { ExecutionState } from './execution/execution-output'
import { FlowRunStatus, PauseMetadata } from './execution/flow-execution'

export type FlowRunId = ApId

export enum RunEnvironment {
    PRODUCTION = 'PRODUCTION',
    TESTING = 'TESTING',
}

export enum FlowRetryStrategy {
    ON_LATEST_VERSION = 'ON_LATEST_VERSION',
    FROM_FAILED_STEP = 'FROM_FAILED_STEP',
}

export type FlowRetryPayload = {
    strategy: FlowRetryStrategy
}

export const FlowRun = Type.Object({
    ...BaseModelSchema,
    projectId: Type.String(),
    flowId: Type.String(),
    tags: Type.Optional(Type.Array(Type.String())),
    flowVersionId: Type.String(),
    flowDisplayName: Type.String(),
    logsFileId: Nullable(Type.String()),
    tasks: Type.Optional(Type.Number()),
    status: Type.Enum(FlowRunStatus),
    duration: Type.Optional(Type.Number()),
    startTime: Type.String(),
    finishTime: Type.Optional(Type.String()),
    environment: Type.Enum(RunEnvironment),
    pauseMetadata: Type.Optional(PauseMetadata),
    // The steps data may be missing if the flow has not started yet,
    // or if the run is older than AP_EXECUTION_DATA_RETENTION_DAYS and its execution data has been purged.
    steps: Nullable(Type.Record(Type.String(), Type.Unknown())),
    failedStepName: Type.Optional(Type.String()),
})

export type FlowRun = Static<typeof FlowRun> & ExecutionState
