
import { z } from 'zod'
import { isNil } from '../../core/common'
import { StreamStepProgress, TriggerHookType, TriggerPayload } from '../engine'
import { ExecutionType } from '../flow-run/execution/execution-output'
import { RunEnvironment } from '../flow-run/flow-run'
import { FlowVersion } from '../flows/flow-version'
import { FlowTriggerType } from '../flows/triggers/trigger'
import { PiecePackage } from '../pieces/piece'

export const LATEST_JOB_DATA_SCHEMA_VERSION = 7

export const InlineJobPayload = z.object({
    type: z.literal('inline'),
    value: z.any(),
})

export const RefJobPayload = z.object({
    type: z.literal('ref'),
    fileId: z.string(),
})

export const JobPayload = z.discriminatedUnion('type', [InlineJobPayload, RefJobPayload])


export const JOB_PRIORITY = {
    critical: 1,
    high: 2,
    medium: 3,
    low: 4,
    veryLow: 5,
    lowest: 6,
}

const TESTING_EXECUTE_FLOW_PRIORITY: keyof typeof JOB_PRIORITY = 'high'
const ASYNC_EXECUTE_FLOW_PRIORITY: keyof typeof JOB_PRIORITY = 'medium'
const SYNC_EXECUTE_FLOW_PRIORITY: keyof typeof JOB_PRIORITY = 'high'
export const RATE_LIMIT_PRIORITY: keyof typeof JOB_PRIORITY = 'lowest'

function getExecuteFlowPriority(environment: RunEnvironment, workerHandlerId: string | undefined | null): keyof typeof JOB_PRIORITY {
    switch (environment) {
        case RunEnvironment.TESTING:
            return TESTING_EXECUTE_FLOW_PRIORITY
        case RunEnvironment.PRODUCTION:
            return isNil(workerHandlerId) ? ASYNC_EXECUTE_FLOW_PRIORITY : SYNC_EXECUTE_FLOW_PRIORITY
    }
}

export function getDefaultJobPriority(job: JobData): keyof typeof JOB_PRIORITY {
    switch (job.jobType) {
        case WorkerJobType.EXECUTE_POLLING:
        case WorkerJobType.RENEW_WEBHOOK:
            return 'veryLow'
        case WorkerJobType.EXECUTE_WEBHOOK:
        case WorkerJobType.EVENT_DESTINATION:
            return 'medium'
        case WorkerJobType.EXECUTE_FLOW:
            return getExecuteFlowPriority(job.environment, job.workerHandlerId)
        case WorkerJobType.EXECUTE_PROPERTY:
        case WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION:
        case WorkerJobType.EXECUTE_VALIDATION:
        case WorkerJobType.EXECUTE_TRIGGER_HOOK:
        case WorkerJobType.EXECUTE_ACTION:
            return 'critical'
    }
}


export enum WorkerJobType {
    RENEW_WEBHOOK = 'RENEW_WEBHOOK',
    EXECUTE_POLLING = 'EXECUTE_POLLING',
    EXECUTE_WEBHOOK = 'EXECUTE_WEBHOOK',
    EXECUTE_FLOW = 'EXECUTE_FLOW',
    EXECUTE_VALIDATION = 'EXECUTE_VALIDATION',
    EXECUTE_TRIGGER_HOOK = 'EXECUTE_TRIGGER_HOOK',
    EXECUTE_PROPERTY = 'EXECUTE_PROPERTY',
    EXECUTE_EXTRACT_PIECE_INFORMATION = 'EXECUTE_EXTRACT_PIECE_INFORMATION',
    EVENT_DESTINATION = 'EVENT_DESTINATION',
    EXECUTE_ACTION = 'EXECUTE_ACTION',
}

export const NON_SCHEDULED_JOB_TYPES: WorkerJobType[] = [
    WorkerJobType.EXECUTE_WEBHOOK,
    WorkerJobType.EXECUTE_FLOW,
    WorkerJobType.EXECUTE_VALIDATION,
    WorkerJobType.EXECUTE_TRIGGER_HOOK,
    WorkerJobType.EXECUTE_PROPERTY,
    WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION,
] as const

// Never change without increasing LATEST_JOB_DATA_SCHEMA_VERSION, and adding a migration
export const RenewWebhookJobData = z.object({
    schemaVersion: z.number(),
    projectId: z.string(),
    platformId: z.string(),
    flowVersionId: z.string(),
    flowId: z.string(),
    jobType: z.literal(WorkerJobType.RENEW_WEBHOOK),
})
export type RenewWebhookJobData = z.infer<typeof RenewWebhookJobData>

// Never change without increasing LATEST_JOB_DATA_SCHEMA_VERSION, and adding a migration
export const PollingJobData = z.object({
    projectId: z.string(),
    platformId: z.string(),
    schemaVersion: z.number(),
    flowVersionId: z.string(),
    flowId: z.string(),
    triggerType: z.nativeEnum(FlowTriggerType),
    jobType: z.literal(WorkerJobType.EXECUTE_POLLING),
})
export type PollingJobData = z.infer<typeof PollingJobData>

export const ExecuteFlowJobData = z.object({
    projectId: z.string(),
    platformId: z.string(),
    jobType: z.literal(WorkerJobType.EXECUTE_FLOW),
    environment: z.nativeEnum(RunEnvironment),
    schemaVersion: z.number(),
    flowId: z.string(),
    flowVersionId: z.string(),
    runId: z.string(),
    workerHandlerId: z.union([z.string(), z.null()]).optional(),
    httpRequestId: z.string().optional(),
    payload: JobPayload,
    executeTrigger: z.boolean().optional(),
    executionType: z.nativeEnum(ExecutionType),
    streamStepProgress: z.nativeEnum(StreamStepProgress),
    stepNameToTest: z.string().optional(),
    sampleData: z.record(z.string(), z.unknown()).optional(),
    logsUploadUrl: z.string(),
    logsFileId: z.string(),
    traceContext: z.record(z.string(), z.string()).optional(),
})
export type ExecuteFlowJobData = z.infer<typeof ExecuteFlowJobData>

export const WebhookJobData = z.object({
    projectId: z.string(),
    platformId: z.string(),
    schemaVersion: z.number(),
    requestId: z.string(),
    payload: JobPayload,
    runEnvironment: z.nativeEnum(RunEnvironment),
    flowId: z.string(),
    saveSampleData: z.boolean(),
    flowVersionIdToRun: z.string(),
    execute: z.boolean(),
    jobType: z.literal(WorkerJobType.EXECUTE_WEBHOOK),
    parentRunId: z.string().optional(),
    failParentOnFailure: z.boolean().optional(),
    traceContext: z.record(z.string(), z.string()).optional(),
})
export type WebhookJobData = z.infer<typeof WebhookJobData>

export const ExecuteValidateAuthJobData = z.object({
    jobType: z.literal(WorkerJobType.EXECUTE_VALIDATION),
    projectId: z.string().optional(),
    platformId: z.string(),
    piece: PiecePackage,
    schemaVersion: z.number(),
    connectionValue: z.unknown(),
    requestId: z.string(),
    webserverId: z.string(),
})
export type ExecuteValidateAuthJobData = z.infer<typeof ExecuteValidateAuthJobData>


export const ExecuteTriggerHookJobData = z.object({
    jobType: z.literal(WorkerJobType.EXECUTE_TRIGGER_HOOK),
    platformId: z.string(),
    projectId: z.string(),
    schemaVersion: z.number(),
    flowId: z.string(),
    flowVersionId: z.string(),
    test: z.boolean(),
    hookType: z.nativeEnum(TriggerHookType),
    triggerPayload: TriggerPayload.optional(),
    requestId: z.string(),
    webserverId: z.string(),
})
export type ExecuteTriggerHookJobData = z.infer<typeof ExecuteTriggerHookJobData>

export const ExecutePropertyJobData = z.object({
    jobType: z.literal(WorkerJobType.EXECUTE_PROPERTY),
    projectId: z.string(),
    platformId: z.string(),
    schemaVersion: z.number(),
    flowVersion: FlowVersion.optional(),
    propertyName: z.string(),
    piece: PiecePackage,
    actionOrTriggerName: z.string(),
    input: z.record(z.string(), z.unknown()),
    sampleData: z.record(z.string(), z.unknown()),
    searchValue: z.string().optional(),
    requestId: z.string(),
    webserverId: z.string(),
})
export type ExecutePropertyJobData = z.infer<typeof ExecutePropertyJobData>

export const ExecuteExtractPieceMetadataJobData = z.object({
    schemaVersion: z.number(),
    jobType: z.literal(WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION),
    projectId: z.undefined(),
    platformId: z.string(),
    piece: PiecePackage,
    requestId: z.string(),
    webserverId: z.string(),
})
export type ExecuteExtractPieceMetadataJobData = z.infer<typeof ExecuteExtractPieceMetadataJobData>

export const ExecuteActionJobData = z.object({
    jobType: z.literal(WorkerJobType.EXECUTE_ACTION),
    projectId: z.string(),
    platformId: z.string(),
    schemaVersion: z.number(),
    piece: PiecePackage,
    actionName: z.string(),
    input: z.record(z.string(), z.unknown()),
    stepNameToTest: z.string().optional(),
    requestId: z.string(),
    webserverId: z.string(),
})
export type ExecuteActionJobData = z.infer<typeof ExecuteActionJobData>

export const UserInteractionJobData = z.union([
    ExecuteValidateAuthJobData,
    ExecuteTriggerHookJobData,
    ExecutePropertyJobData,
    ExecuteExtractPieceMetadataJobData,
    ExecuteActionJobData,
])
export type UserInteractionJobData = z.infer<typeof UserInteractionJobData>

export const UserInteractionJobDataWithoutWatchingInformation = z.union([
    ExecuteValidateAuthJobData.omit({ schemaVersion: true, requestId: true, webserverId: true }),
    ExecuteTriggerHookJobData.omit({ schemaVersion: true, requestId: true, webserverId: true }),
    ExecutePropertyJobData.omit({ schemaVersion: true, requestId: true, webserverId: true }),
    ExecuteExtractPieceMetadataJobData.omit({ schemaVersion: true, requestId: true, webserverId: true }),
    ExecuteActionJobData.omit({ schemaVersion: true, requestId: true, webserverId: true }),
])
export type UserInteractionJobDataWithoutWatchingInformation = z.infer<typeof UserInteractionJobDataWithoutWatchingInformation>

export const EventDestinationJobData = z.object({
    schemaVersion: z.number(),
    platformId: z.string(),
    projectId: z.string().optional(),
    webhookId: z.string(),
    webhookUrl: z.string(),
    payload: z.unknown(),
    jobType: z.literal(WorkerJobType.EVENT_DESTINATION),
})

export type EventDestinationJobData = z.infer<typeof EventDestinationJobData>

export const JobData = z.union([
    PollingJobData,
    RenewWebhookJobData,
    ExecuteFlowJobData,
    WebhookJobData,
    UserInteractionJobData,
    EventDestinationJobData,
])
export type JobData = z.infer<typeof JobData>
export type JobPayload = z.infer<typeof JobPayload>
