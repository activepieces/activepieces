import { ApId } from '../common/id-generator'
import { FlowRunStatus, PauseMetadata } from './execution/flow-execution'
import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, Nullable } from '../common/base-model'
import { ExecutionState } from './execution/execution-output'

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
    // TODO remove this, and create migration to remove it
    terminationReason: Type.Optional(Type.String()),
    logsFileId: Nullable(Type.String()),
    tasks: Type.Optional(Type.Number()),
    status: Type.Enum(FlowRunStatus),
    startTime: Type.String(),
    finishTime: Type.String(),
    environment: Type.Enum(RunEnvironment),
    pauseMetadata: Type.Optional(PauseMetadata),
    ...ExecutionState,
})

export type FlowRun = Static<typeof FlowRun> & ExecutionState
