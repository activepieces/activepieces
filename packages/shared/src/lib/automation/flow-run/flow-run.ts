import { z } from 'zod'
import { ErrorCode } from '../../core/common/activepieces-error'
import { BaseModelSchema, Nullable } from '../../core/common/base-model'
import { ApId } from '../../core/common/id-generator'
import { ExecutionState } from './execution/execution-output'
import { FlowRunStatus } from './execution/flow-execution'

export const PARENT_RUN_ID_HEADER = 'ap-parent-run-id'
export const FAIL_PARENT_ON_FAILURE_HEADER = 'ap-fail-parent-on-failure'
export const RAW_PAYLOAD_HEADER = 'ap-raw-payload'

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

export const FlowRun = z.object({
    ...BaseModelSchema,
    projectId: z.string(),
    flowId: z.string(),
    parentRunId: z.string().optional(),
    failParentOnFailure: z.boolean(),
    triggeredBy: z.string().optional(),
    tags: z.array(z.string()).optional(),
    flowVersionId: z.string(),
    flowVersion: z.object({
        displayName: z.string().optional(),
    }).optional(),
    logsFileId: Nullable(z.string()),
    status: z.nativeEnum(FlowRunStatus),
    startTime: z.string().nullish(),
    finishTime: z.string().nullish(),
    environment: z.nativeEnum(RunEnvironment),
    // The steps data may be missing if the flow has not started yet,
    // or if the run is older than AP_EXECUTION_DATA_RETENTION_DAYS and its execution data has been purged.
    steps: Nullable(z.record(z.string(), z.unknown())),
    failedStep: z.object({
        name: z.string(),
        displayName: z.string(),
    }).optional(),
    stepNameToTest: z.string().optional(),
    archivedAt: Nullable(z.string()),
    stepsCount: z.number().optional(),
})

export const FailedStep = z.object({
    name: z.string(),
    displayName: z.string(),
    message: z.string(),
})
export type FailedStep = z.infer<typeof FailedStep>

export type FlowRun = z.infer<typeof FlowRun> & ExecutionState

export type FlowRunWithRetryError = FlowRun & {
    error?: { errorCode: ErrorCode, errorMessage: string }
}
