import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, Nullable } from '../common/base-model'
import { ApId } from '../common/id-generator'
import { ExecutionState } from './execution/execution-output'
import { FlowRunStatus, PauseMetadata } from './execution/flow-execution'

export const PARENT_RUN_ID_HEADER = 'ap-parent-run-id'
export const FAIL_PARENT_ON_FAILURE_HEADER = 'ap-fail-parent-on-failure'

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
    parentRunId: Type.Optional(Type.String()),
    failParentOnFailure: Type.Boolean(),
    triggeredBy: Type.Optional(Type.String()),
    tags: Type.Optional(Type.Array(Type.String())),
    flowVersionId: Type.String(),
    flowVersion: Type.Optional(Type.Object({
        displayName: Type.Optional(Type.String()),
    })),
    logsFileId: Nullable(Type.String()),
    status: Type.Enum(FlowRunStatus),
    startTime: Type.Optional(Type.String()),
    finishTime: Type.Optional(Type.String()),
    environment: Type.Enum(RunEnvironment),
    pauseMetadata: Type.Optional(PauseMetadata),
    // The steps data may be missing if the flow has not started yet,
    // or if the run is older than AP_EXECUTION_DATA_RETENTION_DAYS and its execution data has been purged.
    steps: Nullable(Type.Record(Type.String(), Type.Unknown())),
    failedStep: Type.Optional(Type.Object({
        name: Type.String(),
        displayName: Type.String(),
    })),
    stepNameToTest: Type.Optional(Type.String()),
    archivedAt: Nullable(Type.String({ default: null })),
    stepsCount: Type.Optional(Type.Number()),
})

export const FailedStep = Type.Object({
    name: Type.String(),
    displayName: Type.String(),
    message: Type.String(),
})
export type FailedStep = Static<typeof FailedStep>

export type FlowRun = Static<typeof FlowRun> & ExecutionState
