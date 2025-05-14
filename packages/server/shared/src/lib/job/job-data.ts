import {
    ExecutionType,
    FlowVersion,
    PackageType,
    PiecePackage,
    PieceType,
    ProgressUpdateType,
    RunEnvironment,
    TriggerHookType,
    TriggerPayload,
    TriggerType,
} from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'

export const LATEST_JOB_DATA_SCHEMA_VERSION = 4

export enum RepeatableJobType {
    RENEW_WEBHOOK = 'RENEW_WEBHOOK',
    EXECUTE_TRIGGER = 'EXECUTE_TRIGGER',
    DELAYED_FLOW = 'DELAYED_FLOW',
}

// Never change without increasing LATEST_JOB_DATA_SCHEMA_VERSION, and adding a migration
export const RenewWebhookJobData = Type.Object({
    schemaVersion: Type.Number(),
    projectId: Type.String(),
    flowVersionId: Type.String(),
    flowId: Type.String(),
    jobType: Type.Literal(RepeatableJobType.RENEW_WEBHOOK),
})
export type RenewWebhookJobData = Static<typeof RenewWebhookJobData>

// Never change without increasing LATEST_JOB_DATA_SCHEMA_VERSION, and adding a migration
export const RepeatingJobData = Type.Object({
    projectId: Type.String(),
    environment: Type.Enum(RunEnvironment),
    schemaVersion: Type.Number(),
    flowVersionId: Type.String(),
    flowId: Type.String(),
    triggerType: Type.Enum(TriggerType),
    jobType: Type.Literal(RepeatableJobType.EXECUTE_TRIGGER),
})
export type RepeatingJobData = Static<typeof RepeatingJobData>

// Never change without increasing LATEST_JOB_DATA_SCHEMA_VERSION, and adding a migration
export const DelayedJobData = Type.Object({
    projectId: Type.String(),
    environment: Type.Enum(RunEnvironment),
    schemaVersion: Type.Number(),
    flowVersionId: Type.String(),
    runId: Type.String(),
    httpRequestId: Type.Optional(Type.String()),
    synchronousHandlerId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    progressUpdateType: Type.Optional(Type.Enum(ProgressUpdateType)),
    jobType: Type.Literal(RepeatableJobType.DELAYED_FLOW),
})
export type DelayedJobData = Static<typeof DelayedJobData>

export const ScheduledJobData = Type.Union([
    RepeatingJobData,
    DelayedJobData,
    RenewWebhookJobData,
])
export type ScheduledJobData = Static<typeof ScheduledJobData>

export const OneTimeJobData = Type.Object({
    projectId: Type.String(),
    environment: Type.Enum(RunEnvironment),
    flowVersionId: Type.String(),
    runId: Type.String(),
    synchronousHandlerId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    httpRequestId: Type.Optional(Type.String()),
    payload: Type.Any(),
    executionType: Type.Enum(ExecutionType),
    retryPayload: Type.Optional(Type.Any()),
    progressUpdateType: Type.Enum(ProgressUpdateType),
})
export type OneTimeJobData = Static<typeof OneTimeJobData>

export const WebhookJobData = Type.Object({
    projectId: Type.String(),
    schemaVersion: Type.Number(),
    requestId: Type.String(),
    payload: Type.Any(),
    runEnvironment: Type.Enum(RunEnvironment),
    flowId: Type.String(),
    saveSampleData: Type.Boolean(),
    flowVersionIdToRun: Type.String(),
    execute: Type.Boolean(),
})
export type WebhookJobData = Static<typeof WebhookJobData>


export enum UserInteractionJobType {
    EXECUTE_VALIDATION = 'EXECUTE_VALIDATION',
    EXECUTE_ACTION = 'EXECUTE_ACTION',
    EXECUTE_TRIGGER_HOOK = 'EXECUTE_TRIGGER_HOOK',
    EXECUTE_PROPERTY = 'EXECUTE_PROPERTY',
    EXECUTE_EXTRACT_PIECE_INFORMATION = 'EXECUTE_EXTRACT_PIECE_INFORMATION',
    EXECUTE_TOOL = 'EXECUTE_TOOL',
}

export const ExecuteValidateAuthJobData = Type.Object({
    requestId: Type.String(),
    webserverId: Type.String(),
    jobType: Type.Literal(UserInteractionJobType.EXECUTE_VALIDATION),
    projectId: Type.Optional(Type.String()),
    platformId: Type.String(),
    piece: PiecePackage,
    connectionValue: Type.Unknown(),
})
export type ExecuteValidateAuthJobData = Static<typeof ExecuteValidateAuthJobData>

export const ExecuteActionJobData = Type.Object({
    requestId: Type.String(),
    jobType: Type.Literal(UserInteractionJobType.EXECUTE_ACTION),
    projectId: Type.String(),
    flowVersion: FlowVersion,
    stepName: Type.String(),
    webserverId: Type.String(),
    sampleData: Type.Record(Type.String(), Type.Unknown()),
    runEnvironment: Type.Enum(RunEnvironment),
})
export type ExecuteActionJobData = Static<typeof ExecuteActionJobData>

export const ExecuteToolJobData = Type.Object({
    requestId: Type.String(),
    webserverId: Type.String(),
    jobType: Type.Literal(UserInteractionJobType.EXECUTE_TOOL),
    projectId: Type.String(),
    actionName: Type.String(),
    pieceName: Type.String(),
    pieceVersion: Type.String(),
    packageType: Type.Enum(PackageType),
    pieceType: Type.Enum(PieceType),
    input: Type.Record(Type.String(), Type.Unknown()),
})
export type ExecuteToolJobData = Static<typeof ExecuteToolJobData>

export const ExecuteTriggerHookJobData = Type.Object({
    requestId: Type.String(),
    jobType: Type.Literal(UserInteractionJobType.EXECUTE_TRIGGER_HOOK),
    projectId: Type.String(),
    flowVersion: FlowVersion,
    test: Type.Boolean(),
    webserverId: Type.String(),
    hookType: Type.Enum(TriggerHookType),
    triggerPayload: Type.Optional(TriggerPayload),
})
export type ExecuteTriggerHookJobData = Static<typeof ExecuteTriggerHookJobData>

export const ExecutePropertyJobData = Type.Object({
    requestId: Type.String(),
    jobType: Type.Literal(UserInteractionJobType.EXECUTE_PROPERTY),
    projectId: Type.String(),
    flowVersion: FlowVersion,
    propertyName: Type.String(),
    piece: PiecePackage,
    actionOrTriggerName: Type.String(),
    input: Type.Record(Type.String(), Type.Unknown()),
    webserverId: Type.String(),
    sampleData: Type.Record(Type.String(), Type.Unknown()),
    searchValue: Type.Optional(Type.String()),
})
export type ExecutePropertyJobData = Static<typeof ExecutePropertyJobData>

export const ExecuteExtractPieceMetadataJobData = Type.Object({
    requestId: Type.String(),
    webserverId: Type.String(),
    jobType: Type.Literal(UserInteractionJobType.EXECUTE_EXTRACT_PIECE_INFORMATION),
    projectId: Type.Optional(Type.String()),
    platformId: Type.String(),
    piece: PiecePackage,
})
export type ExecuteExtractPieceMetadataJobData = Static<typeof ExecuteExtractPieceMetadataJobData>

export const UserInteractionJobData = Type.Union([
    ExecuteValidateAuthJobData,
    ExecuteActionJobData,
    ExecuteTriggerHookJobData,
    ExecuteToolJobData,
    ExecutePropertyJobData,
    ExecuteExtractPieceMetadataJobData,
])
export type UserInteractionJobData = Static<typeof UserInteractionJobData>

export const UserInteractionJobDataWithoutWatchingInformation = Type.Union([
    Type.Omit(ExecuteValidateAuthJobData, ['webserverId', 'requestId']),
    Type.Omit(ExecuteActionJobData, ['webserverId', 'requestId']),
    Type.Omit(ExecuteToolJobData, ['webserverId', 'requestId']),
    Type.Omit(ExecuteTriggerHookJobData, ['webserverId', 'requestId']),
    Type.Omit(ExecutePropertyJobData, ['webserverId', 'requestId']),
    Type.Omit(ExecuteExtractPieceMetadataJobData, ['webserverId', 'requestId']),
])
export type UserInteractionJobDataWithoutWatchingInformation = Static<typeof UserInteractionJobDataWithoutWatchingInformation>

export const JobData = Type.Union([
    ScheduledJobData,
    OneTimeJobData,
    WebhookJobData,
    UserInteractionJobData,
])
export type JobData = Static<typeof JobData>
